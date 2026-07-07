import FeaturedSeries from '../FeaturedSeries';

export default function FeaturedSeriesExample() {
  return (
    <FeaturedSeries 
      seriesData={[
        { name: "Demon Slayer", imageUrl: null },
        { name: "One Piece", imageUrl: null },
      ]}
      onSeriesClick={(seriesName) => console.log(`Clicked series: ${seriesName}`)}
    />
  );
}