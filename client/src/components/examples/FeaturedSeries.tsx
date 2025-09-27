import FeaturedSeries from '../FeaturedSeries';

export default function FeaturedSeriesExample() {
  return (
    <FeaturedSeries 
      onSeriesClick={(seriesId) => console.log(`Clicked series: ${seriesId}`)}
    />
  );
}