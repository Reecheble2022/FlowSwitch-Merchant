import React, { useState, useRef, useEffect } from 'react';
import { useModal } from '../providers/ModalContext';

const MerchantRegistrationTriggerButton = ({ }) => {
    const { openModal, activeModal, closeModal } = useModal();

    return (
        <div className="items-center">
            <div className="w-[70%] hover:text-blue-600 my-4 p-2 rounded-md mx-auto cursor-pointer"
                onClick={() => openModal('merchantSignup')}
            >
                Signup as a merchant
            </div>
        </div>
    );
};

export { MerchantRegistrationTriggerButton };