import React, { useState, useEffect } from "react";
import styles from "./CommonPopup.module.css";

const CommonPopup = ({ show, onHide, onConfirm, title, children }) => {
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
        setToastMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleConfirm = () => {
    const result = onConfirm();
    if (result && result.error) {
      setToastMessage(result.error);
      setShowToast(true);
    }
  };

  if (!show) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div className={styles.overlay} onClick={onHide}></div>

      {/* 모달 */}
      <div className={`${styles.modal} show d-block`} tabIndex="-1">
        <div className={`${styles.modalDialog} modal-dialog-centered`}>
          <div className={`${styles.modalContent} modal-content`}>
            <div className={`${styles.modalHeader} modal-header`}>
              <h5 className={`${styles.modalTitle} modal-title`}>{title}</h5>
              <button type="button" className={`${styles.btnClose} btn-close`} onClick={onHide}></button>
            </div>
            <div className={`${styles.modalBody} modal-body`}>
              {children}
              {showToast && (
                <div className={`${styles.toast} alert alert-danger`} role="alert">
                  {toastMessage}
                </div>
              )}
            </div>
            <div className={`${styles.modalFooter} modal-footer`}>
              <button type="button" className={`${styles.margin1} ${styles.btn} ${styles.btnSecondary} btn btn-secondary`} onClick={onHide}>
                취소
              </button>
              <button type="button" className={`${styles.margin1} ${styles.btn} ${styles.btnPrimary} btn text-bg-success`} onClick={handleConfirm}>
                확인
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommonPopup;