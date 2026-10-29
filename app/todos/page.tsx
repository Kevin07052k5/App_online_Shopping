'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function TodosPage() {
  const [todos, setTodos] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function fetchTodos() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from('todos').select()
        if (error) {
          setError(error.message)
        } else if (data) {
          setTodos(data)
        }
      } catch (err: any) {
        setError(err.message || 'Lỗi tải dữ liệu')
      } finally {
        setLoading(false)
      }
    }
    fetchTodos()
  }, [])

  return (
    <div className="p-8 max-w-md mx-auto font-sans">
      <h1 className="text-xl font-bold mb-4">Supabase Test: Todos</h1>
      {error && (
        <div className="p-3 mb-4 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}
      {loading ? (
        <p className="text-gray-400 text-sm">Đang tải danh sách...</p>
      ) : (
        <ul className="list-disc pl-5 space-y-1">
          {todos && todos.length > 0 ? (
            todos.map((todo: { id: string | number; name?: string }) => (
              <li key={todo.id}>{todo.name || JSON.stringify(todo)}</li>
            ))
          ) : (
            <li className="text-gray-500">Chưa có dữ liệu trong bảng todos hoặc bảng trống.</li>
          )}
        </ul>
      )}
    </div>
  )
}
