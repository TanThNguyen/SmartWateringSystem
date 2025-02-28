import React, { useEffect } from 'react';
import './error.css';

const ErrorBoundary = () => {
  useEffect(() => {
    document.title = '404 Not Found';
  }, []);

  return (
    <div className="error-page">
      <section id="not-found">
        <div id="title">404 Error Page</div>
        <div className="circles">
          <p>
            404 <br />
            <small>PAGE NOT FOUND</small>
          </p>
          <span className="circle big"></span>
          <span className="circle med"></span>
          <span className="circle small"></span>
        </div>
      </section>
    </div>
  );
};

export default ErrorBoundary;
