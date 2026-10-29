import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // Can be ignored if middleware is refreshing sessions.
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Supabase exchangeCodeForSession error in route handler:', error)
      return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error.message)}`)
    }

    if (data?.user) {
      const user = data.user
      const metadata = user.user_metadata || {}
      const cleanEmail = user.email || metadata.email || ''
      const cleanName =
        metadata.full_name || metadata.name || cleanEmail.split('@')[0] || 'Khách hàng'
      const avatar =
        metadata.avatar_url ||
        metadata.picture ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80'
      const rawProvider = (user.app_metadata?.provider || 'GOOGLE').toUpperCase()

      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          email: cleanEmail,
          name: cleanName,
          phone_number: metadata.phone_number || metadata.phone || '',
          role: 'USER',
          provider: rawProvider as any,
          avatar_url: avatar,
          updated_at: new Date().toISOString(),
        })
      } catch (err) {
        console.warn('Upsert profile error in callback route:', err)
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}

