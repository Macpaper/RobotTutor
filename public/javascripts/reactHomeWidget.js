(async function () {
  const mountPoint = document.getElementById('react-home-widget');
  if (!mountPoint) return;

  const [{ default: React }, { default: ReactDOM }] = await Promise.all([
    import('https://esm.sh/react@19.2.7'),
    import('https://esm.sh/react-dom@19.2.7')
  ]);

  const e = React.createElement;

  function Widget() {
    const [count, setCount] = React.useState(0);

    return e('div', { className: 'react-widget' },
      e('h2', null, 'React widget on the home page'),
      e('p', null, 'This component is rendered from React inside an EJS view.'),
      e('p', null, 'Button clicks: ' + count),
      e('button', { onClick: () => setCount(count + 1) }, 'Increment')
    );
  }

  ReactDOM.createRoot(mountPoint).render(e(Widget));
})();
