"use client"

import { Component, ReactNode } from "react"

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-semibold text-red-700">Ocurrió un error</p>
          <p className="mt-1 text-sm text-red-600">{this.state.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}