import './App.css'
import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/home/HomePage'
import MovieDetails from './pages/MovieDetails';
import TvDetails from './pages/TvDetails';
import WatchPage from './pages/WatchPage';
import PeopleDetails from './pages/PeopleDetails';
import MyListPage from './pages/MyListPage';
import SearchPage from './pages/home/discover/search';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path="/tv/:id" element={<TvDetails />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
        <Route path="/watch/:type/:id" element={<WatchPage />} />
        <Route path="/person/:id" element={<PeopleDetails />} />
        <Route path="/mylist" element={<MyListPage />} />
      </Routes>
      <SearchPage />
      <Toaster 
        toastOptions={{
          style: {
            background: 'rgba(11, 13, 16, 0.98)',
            color: '#f6f7fb',
            border: '1px solid rgba(255, 38, 51, 0.25)',
            fontFamily: '"Inter", sans-serif',
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '16px',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            padding: '12px 18px',
          },
          success: {
            iconTheme: {
              primary: '#ff2633',
              secondary: '#f6f7fb',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff2633',
              secondary: '#f6f7fb',
            },
          },
        }}
      />
    </>

  );
}

export default App;
