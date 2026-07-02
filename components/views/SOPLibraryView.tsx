
import React, { useState } from 'react';
import { SOP } from '../../types';
import { SOPList } from '../sops/SOPList';
import { SOPDetail } from '../sops/SOPDetail';

interface SOPLibraryViewProps {
  sops: SOP[];
  onEditSOP: (sop: SOP) => void;
  onAddSOP: () => void;
}

export const SOPLibraryView: React.FC<SOPLibraryViewProps> = ({ sops, onEditSOP, onAddSOP }) => {
  const [selectedSOP, setSelectedSOP] = useState<SOP | null>(null);

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto">
      {selectedSOP ? (
        <SOPDetail 
          sop={selectedSOP} 
          onBack={() => setSelectedSOP(null)} 
          onEdit={() => onEditSOP(selectedSOP)}
        />
      ) : (
        <SOPList 
          sops={sops} 
          onSelectSOP={setSelectedSOP} 
          onAddSOP={onAddSOP}
        />
      )}
    </div>
  );
};
