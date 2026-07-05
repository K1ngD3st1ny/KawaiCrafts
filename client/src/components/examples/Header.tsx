import Header from '../Header';

export default function HeaderExample() {
  return (
    <Header 
      onCartClick={() => console.log('Cart clicked')}
      onSearchSubmit={(query) => console.log('Search submitted:', query)}
    />
  );
}