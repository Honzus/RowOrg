import AvailabilityCalendar from '../components/AvailabilityCalendar';

export default function RowerAvailability() {
  return (
    <>
      <div className="page-title">
        <div>
          <div className="sub mono">YOUR WEEKLY SCHEDULE</div>
          <h2>Availability</h2>
        </div>
      </div>
      <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 620, marginBottom: 20 }}>
        Drag any cell to paint a time range. Hover a slot and click ✕ to remove it. The coach sees these alongside the team heatmap when planning.
      </p>
      <AvailabilityCalendar />
    </>
  );
}
