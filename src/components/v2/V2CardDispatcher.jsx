import CardProduct from './cards/CardProduct';
import CardProductGrid from './cards/CardProductGrid';
import CardCartConfirm from './cards/CardCartConfirm';
import CardCart from './cards/CardCart';
import CardShipping from './cards/CardShipping';
import CardCheckout from './cards/CardCheckout';
import CardOrderConfirmed from './cards/CardOrderConfirmed';
import CardB2BQuote from './cards/CardB2BQuote';
import CardGiftCard from './cards/CardGiftCard';
import CardOrderStatus from './cards/CardOrderStatus';
import CardCompare from './cards/CardCompare';
import CardOnboarding from './cards/CardOnboarding';
import CardB2BFork from './cards/CardB2BFork';
import V2TransitionBanner from './V2TransitionBanner';

// Dispatcher: 1 card del río = 1 componente. switch(card.type).
export default function V2CardDispatcher({ card, perfil, handlers }) {
  if (!card || !card.type) return null;
  const { onAddCart, onQuote, onPick, onCheckout, onShippingContinue, onRetryPay, onAsk, onForkPick } = handlers || {};

  switch (card.type) {
    case 'onboarding':
      return <CardOnboarding onAsk={onAsk} onForkPick={onForkPick} />;
    case 'b2b_fork':
      return <CardB2BFork data={card.data} onPick={onForkPick} />;
    case 'transition':
      return <V2TransitionBanner variant={card.data?.variant} onAction={onForkPick && ((v) => onForkPick(v === 'to_b2b' ? 'b2b' : 'b2c'))} />;
    case 'product':
      return <CardProduct data={card.data} perfil={perfil} onAddCart={onAddCart} onQuote={onQuote} />;
    case 'product_grid':
      return <CardProductGrid data={card.data} perfil={perfil} onPick={onPick} onAddCart={onAddCart} />;
    case 'compare':
      return <CardCompare data={card.data} perfil={perfil} onPick={onPick} />;
    case 'cart_confirm':
      return <CardCartConfirm data={card.data} onCheckout={onCheckout} />;
    case 'cart':
      return <CardCart onCheckout={onCheckout} />;
    case 'shipping':
      return <CardShipping data={card.data} onContinue={onShippingContinue} />;
    case 'checkout':
      return <CardCheckout data={card.data} />;
    case 'order_confirmed':
      return <CardOrderConfirmed data={{ ...card.data, onRetry: onRetryPay }} />;
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