import { Component } from "react";
import { AlertTriangle } from "lucide-react";

import Button from "@/components/ui/button";

// App-level error boundary: catches render errors anywhere below it and shows a
// recoverable fallback instead of a blank screen.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("Uncaught render error:", error, info);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-7" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Oups, une erreur est survenue</h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            Une erreur inattendue s'est produite. Vous pouvez recharger la page pour reprendre.
          </p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            Recharger la page
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
