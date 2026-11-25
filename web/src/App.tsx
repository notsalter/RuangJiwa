import Router from 'preact-router';

export function App() {
  return (
    <Router>
      <Home path="/" />
    </Router>
  );
}

function Home(_props: { path?: string }) {
  return (
    <main class="page">
      <h1>RuangJiwa</h1>
      <p>Web PWA rewrite is being built incrementally — see MIGRATION.md.</p>
    </main>
  );
}
