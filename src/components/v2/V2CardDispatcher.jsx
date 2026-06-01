import CardProduct from './cards/CardProduct';
import CardProductGrid from './cards/CardProductGrid';
import CardCartConfirm from './cards/CardCartConfirm';
import CardCheckout from './cards/CardCheckout';
import CardB2BQuote from './cards/CardB2BQuote';
import CardGiftCard from './cards/CardGiftCard';
import CardOrderStatus from './cards/CardOrderStatus';

// Dispatcher: 1 card del río = 1 componente. switch(card.type).
export default function V2CardDispatcher({ card, perfil, handlers }) {
  if (!card || !card.type) return null;
  const { onAddCart, onQuote, onPick, onCheckout } = handlers || {};

  switch (card.type) {
    case 'product':
      return <CardProduct data={card.data} perfil={perfil} onAddCart={onAddCart} onQuote={onQuote} />;
    case 'product_grid':
      return <CardProductGrid data={card.data} perfil={perfil} onPick={onPick} />;
    case 'cart_confirm':
      return <CardCartConfirm data={card.data} onCheckout={onCheckout} />;
    case 'checkout':
      return <CardCheckout data={card.data} />;
    case 'b2b_quote':
      return <CardB2BQuote data={card.data} />;
    case 'gift_card':
      return <CardGiftCard data={card.data} />;
    case 'order_status':
      return <CardOrderStatus data={card.data} />;
    default:
      return null;
  }
}