import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function TodosPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos, error } = await supabase.from('todos').select()

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Supabase Test: Todos</h1>
      {error && (
        <div className="p-3 mb-4 bg-red-100 text-red-700 rounded text-sm">
          {error.message}
        </div>
      )}
      <ul className="list-disc pl-5 space-y-1">
        {todos && todos.length > 0 ? (
          todos.map((todo: { id: string | number; name?: string }) => (
            <li key={todo.id}>{todo.name || JSON.stringify(todo)}</li>
          ))
        ) : (
          <li className="text-gray-500">Chưa có dữ liệu trong bảng todos hoặc bảng trống.</li>
        )}
      </ul>
    </div>
  )
}
