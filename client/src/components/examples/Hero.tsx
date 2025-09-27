import Hero from '../Hero';

export default function HeroExample() {
  return (
    <Hero onExploreClick={() => console.log('Explore clicked')} />
  );
}