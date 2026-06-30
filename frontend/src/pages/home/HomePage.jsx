import { useEffect } from 'react';
import HomeScreen from './HomeScreen';


const HomePage = () => {
  useEffect(() => {
    document.title = "EpicStream";
  }, []);

  return <HomeScreen />;
};

export default HomePage;
