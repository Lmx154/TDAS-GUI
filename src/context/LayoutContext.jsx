import React, { createContext, useContext, useState } from 'react';
import debounce from 'lodash/debounce';

const LayoutContext = createContext();

export function LayoutProvider({ children }) {
  const [componentDimensions, setComponentDimensions] = useState({});
  
  const updateDimensions = debounce((dimensions) => {
    setComponentDimensions(dimensions);
  }, 16); // ~60fps

  return (
    <LayoutContext.Provider value={{ componentDimensions, updateDimensions }}>
      {children}
    </LayoutContext.Provider>
  );
}

export const useLayout = () => useContext(LayoutContext);
