import React from 'react';
import { Button, ButtonGroup } from '@mui/material';

interface UnitSelectorProps {
  selectedUnit: string | null;
  onUnitSelect: (unit: string,type: string,userId: string) => void;
  disabled: boolean;
}

const UnitSelector: React.FC<UnitSelectorProps> = ({ selectedUnit, onUnitSelect, disabled }) => {
  const units = ['10U', '50U', '100U', '500U','1000U'];
  
  return (
    <ButtonGroup variant="contained"
    className="custom-button-group"
    sx={{
        backgroundColor: '',
        display:"flex",
        justifyContent:'flex-start',
        width:'100%',
      }}>
      {units.map((unit) => (
        <Button
          key={unit}
          onClick={() => onUnitSelect(unit,"","")}
          disabled={disabled}
          sx={{
            flex:'1',
            padding:'5px 0',
            backgroundColor: selectedUnit === unit ? '#ff842d' : '#303030',
            borderRadius: '10px',
            fontSize:'18px',
            '&:hover': {
              backgroundColor: selectedUnit === unit ? '##c06a31' : '#757575',
            },
            '&.Mui-disabled': {
              backgroundColor: '#e0e0e0',
              color: '#9e9e9e',
            },
          }}
        >
          {unit}
        </Button>
      ))}
    </ButtonGroup>
  );
};

export default UnitSelector;

