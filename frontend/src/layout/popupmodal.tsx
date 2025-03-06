import React from "react";

interface PopupModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

const PopupModal: React.FC<PopupModalProps> = ({ title, children, onClose }) => {
  return (
    <div className="popupOverlay">
      <div className="popupContent">
        <div className="popupHeader">
          <h2>{title}</h2>
          <button className="closeButton" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="popupBody">{children}</div>
      </div>
      <style jsx>{`
        .popupOverlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }
        .popupContent {
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          width: 90%;
          max-width: 600px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          z-index: 100
        }
        .popupHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .closeButton {
          background: transparent;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
        }
        .popupBody {
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
};

export default PopupModal;
