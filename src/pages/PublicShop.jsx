import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ShopLanding from './ShopLanding';
import Shop from './Shop';
import ProductoDetalle from './ProductoDetalle';
import Carrito from './Carrito';

export default function PublicShop() {
  return (
    <Routes>
      <Route path="/" element={<ShopLanding />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/producto/:id" element={<ProductoDetalle />} />
      <Route path="/cart" element={<Carrito />} />
    </Routes>
  );
}