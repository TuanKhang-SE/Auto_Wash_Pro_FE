import  AppRoutes  from './routes/AppRoutes';   
import LoginPage from './pages/auth/Login';
import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Register from './pages/auth/Register';
import LoginedHomePage from './pages/customer/LoginedHomePage';
import RegisterCar from './pages/customer/RegisterCar';


function App() {
  return (
  <div>
    <nav>
    </nav>

    <Routes>
      <Route path ="/login" element={<LoginPage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/home" element={<LoginedHomePage />} />
      <Route path="/register-car" element={<RegisterCar />} />
    </Routes>
  </div>
  );
}

export default App;