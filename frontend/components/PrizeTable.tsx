type Prize = {
  _id: string;
  name: string;
  value: number;
  probability: number;
  surfaceProbability?: number;
  isActive: boolean;
};

export function PrizeTable({ prizes }: { prizes: Prize[] }) {
  return (
    <div className="card" style={{ padding: 18, background: 'rgba(255,255,255,0.02)' }}>
      <h3 style={{ marginTop: 0, color: '#efd08e' }}>Prize Pool</h3>
      <table className="table-shell">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Item</th>
            <th style={{ textAlign: 'right' }}>Remaining Quantity</th>
            <th style={{ textAlign: 'right' }}>Probability</th>
          </tr>
        </thead>
        <tbody>
          {prizes.filter((p) => p.isActive).map((prize) => (
            <tr key={prize._id}>
              <td>{prize.name}</td>
              <td style={{ textAlign: 'right' }}>{prize.value}</td>
              <td style={{ textAlign: 'right' }}>
                {(prize.surfaceProbability ?? prize.probability ?? 0).toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
