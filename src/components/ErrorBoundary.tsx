'use client'
import { Component, ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 text-center text-stone-400 bg-white rounded-2xl border border-stone-200/40">
          <p className="text-sm">Something went wrong loading this section.</p>
          <button onClick={() => this.setState({ hasError: false })} className="text-amber underline mt-2 text-sm font-medium">Try again</button>
        </div>
      )
    }
    return this.props.children
  }
}
