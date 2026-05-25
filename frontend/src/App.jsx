import './App.css'
import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/home/HomePage'
import MovieDetails from './pages/MovieDetails';
import TvDetails from './pages/TvDetails';
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
        <Route path="/search" element={<SearchPage />} />
        <Route path="/person/:id" element={<PeopleDetails />} />
        <Route path="/mylist" element={<MyListPage />} />
      </Routes>
      <Toaster />
    </>

  );
}

export default App;
