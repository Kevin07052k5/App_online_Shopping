import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user) {
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
      const provider = ['GOOGLE', 'APPLE', 'FACEBOOK', 'TWITTER'].includes(rawProvider)
        ? rawProvider
        : 'GOOGLE'

      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          email: cleanEmail,
          name: cleanName,
          phone_number: metadata.phone_number || metadata.phone || '',
          role: 'USER',
          provider: provider as any,
          avatar_url: avatar,
          updated_at: new Date().toISOString(),
        })
      } catch (err) {
        console.warn('Auto-upsert profile on OAuth callback error:', err)
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

  // Redirect to home if exchange failed or code was missing
  return NextResponse.redirect(`${origin}${next}`)
}
