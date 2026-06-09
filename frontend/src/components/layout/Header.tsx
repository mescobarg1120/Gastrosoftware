interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
      <h1 className="text-xl font-semibold text-slate-100">{title}</h1>
    </header>
  );
}
