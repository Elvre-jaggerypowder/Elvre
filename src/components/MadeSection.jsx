import './MadeSection.css';

function HowMadeSection() {
  return (
    <section id="made" className="howmade-section">
      <div className="howmade-container">
        <div className="howmade-header" data-aos="fade-up">
          <span className="howmade-tag">✦ TRADITIONAL CRAFT ✦</span>
          <h2 className="howmade-heading">How ELVRE is Made</h2>
        </div>
        <div className="howmade-content" data-aos="fade-up" data-aos-delay="200">
          <div className="howmade-steps">
            <div className="step">
              <div className="step-number">01</div>
              <h3>Fresh Sugarcane</h3>
              <p>Premium quality sugarcane sourced directly from local farmers</p>
            </div>
            <div className="step">
              <div className="step-number">02</div>
              <h3>Cold Pressed</h3>
              <p>Juice extracted using traditional cold press method</p>
            </div>
            <div className="step">
              <div className="step-number">03</div>
              <h3>Slow Boiled</h3>
              <p>Simmered in iron vessels to retain natural minerals</p>
            </div>
            <div className="step">
              <div className="step-number">04</div>
              <h3>Pure Powder</h3>
              <p>Dried and ground into golden, pure powder</p>  {/* ✅ CHANGED - removed chemical-free */}
            </div>
          </div>
          <p className="howmade-description">
            ElVRE Jaggery is made using traditional methods with modern techniques. Fresh sugarcane is crushed 
            to get the juice, which is slowly boiled into jaggery syrup. The syrup is then dried and ground 
            into golden powder. Every step is done by farmers, using no chemicals or preservatives—just pure, 
            simple goodness, made with love and care.  {/* ✅ CHANGED */}
          </p>
        </div>
      </div>
    </section>
  );
}

export default HowMadeSection;