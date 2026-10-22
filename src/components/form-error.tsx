export function FormError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null;
  return <p id={id} className="field-error" role="alert">{message}</p>;
}