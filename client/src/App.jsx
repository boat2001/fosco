import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation, Outlet } from 'react-router-dom';

import { Header } from './components/Header.jsx';
import { Footer } from './components/Footer.jsx';

import Home from './pages/Home.jsx';
import News from './pages/News.jsx';
import Article from './pages/Article.jsx';
import Events from './pages/Events.jsx';
import Gallery from './pages/Gallery.jsx';
import Contact from './pages/Contact.jsx';
import ContentPage from './pages/ContentPage.jsx';
import NotFound from './pages/NotFound.jsx';

// The admin console is only needed by staff — keep it out of the public bundle.
const Admin = lazy(() => import('./pages/Admin.jsx'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [pathname]);
  return null;
}

/** Public site chrome: header and footer wrap every page except the admin console. */
function PublicLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main" style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route
          path="/admin"
          element={
            <Suspense fallback={<div className="admin" />}>
              <Admin />
            </Suspense>
          }
        />

        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="news" element={<News />} />
          <Route path="news/:slug" element={<Article />} />
          <Route path="events" element={<Events />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="contact-us" element={<Contact />} />

          {/* Every other archived WordPress page renders from its stored blocks. */}
          <Route path=":slug" element={<ContentPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
