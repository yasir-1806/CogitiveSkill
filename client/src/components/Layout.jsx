import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col" style={{ marginLeft: '260px' }}>
        <Navbar />
        <main className="flex-1 p-6 lg:p-8" style={{ color: 'var(--text-primary)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
