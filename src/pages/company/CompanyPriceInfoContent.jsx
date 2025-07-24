
const CompanyPriceInfoContent = () => {
const roomData = [
    { 구분: "1인실", 정상가: "₩300,000", "6개월(5%)": "₩1,710,000", "12개월(8%)": "₩3,240,000" },
    { 구분: "2인실", 정상가: "₩550,000", "6개월(5%)": "₩3,135,000", "12개월(8%)": "₩5,940,000" },
    { 구분: "4인실", 정상가: "₩900,000", "6개월(5%)": "₩5,130,000", "12개월(8%)": "₩9,720,000" },
    { 구분: "8인실", 정상가: "₩1,600,000", "6개월(5%)": "₩9,120,000", "12개월(8%)": "₩17,280,000" },
  ];

  return (
    <div className="MainWrapper">
      <div className="BigMom">
        <div className="MainTitle">가격 안내</div>
        <div className="MainContent">
          [호실별 이용료 할인 서비스]
        </div>
        <div>
          <table>
            <thead>
              <tr>
                <th>구분</th>
                <th>정상가</th>
                <th>6개월(5%)</th>
                <th>12개월(8%)</th>
              </tr>
            </thead>
            <tbody>
              {roomData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td>{row.구분}</td>
                  <td>{row.정상가}</td>
                  <td>{row["6개월(5%)"]}</td>
                  <td>{row["12개월(8%)"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pricedetails">
            <p>*이용료 VAT 별도</p>
            <p>*1개월부터 계약 가능</p>
        </div>
      </div>
    </div>
  );
};

export default CompanyPriceInfoContent;
