import AuthButton from './AuthButton';

export default function Nav() {
  return (
    <nav className="p-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        {/* Other nav items */}
      </div>
      <AuthButton />
    </nav>
  );
}
