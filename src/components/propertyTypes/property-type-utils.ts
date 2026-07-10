/**
 * Shared display helpers for property type list and detail views.
 */

export function getValueTypeColor(type?: string): string {
  switch (type) {
    case 'string':
      return 'bg-info-light text-info-dark';
    case 'integer':
    case 'long':
      return 'bg-success-light text-success-dark';
    case 'float':
      return 'bg-secondary-light text-secondary-dark';
    case 'date':
      return 'bg-warning-light text-warning-dark';
    case 'boolean':
      return 'bg-accent-light text-accent-dark';
    case 'email':
      return 'bg-info-light text-info-dark';
    case 'set':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function getTargetColor(target?: string): string {
  switch (target) {
    case 'profiles':
      return 'bg-info-light text-info-dark border-info';
    case 'sessions':
      return 'bg-success-light text-success-dark border-success';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}
