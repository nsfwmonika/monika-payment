import React, { FC, useEffect, useState } from 'react'
import { Box, TextField, Select, MenuItem, Button } from '@mui/material';


import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import InfoIcon from '@mui/icons-material/Info';



interface ExchangeInfosProps {
  basePoints: number | null
  chainPrice: number | null
  level: number | null
  rebatePercentage: number | null
  rewardPoints: number | null
}

export const ExchangeInfos: FC<ExchangeInfosProps> = ({
  basePoints,
  chainPrice,
  level,
  rebatePercentage,
  rewardPoints
}) => {

  const [localState, setLocalState] = useState<string | null>(null)

  useEffect(() => {


  }, [basePoints, chainPrice, level, rebatePercentage, rewardPoints])

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const openPro = Boolean(anchorEl);
  return (
    <div style={{
      padding: "10px 15px",
      marginTop: "24px",
      border: "1px solid #4e4e4e",
      borderRadius: "14px",
      color: "#bfbfc3",
      background:"#121214"
    }}>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
      }}>
        <span style={{
          display: "flex",
        }}>
          Points (Including bonus points)
          {/* <div>
            <Typography
              aria-owns={openPro ? 'mouse-over-popover' : undefined}
              aria-haspopup="true"
              onMouseEnter={handlePopoverOpen}
              onMouseLeave={handlePopoverClose}
            >
              <InfoIcon
                sx={{
                  marginLeft: "5px",
                  fontSize: 18
                }}
              ></InfoIcon>
            </Typography>
            <Popover
              id="mouse-over-popover"
              sx={{ pointerEvents: 'none' }}
              open={openPro}
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              onClose={handlePopoverClose}
              disableRestoreFocus
            >
              <Typography sx={{ p: 1 }}>{'Points to be earned [including bonus points]'}</Typography>
            </Popover>
          </div> */}
        </span>
        <span style={{
          color: "#bfbfc3"
        }}>
          {basePoints}
        </span>
      </div>
      {level && (
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "8px"
        }}>
          <span style={{
            display: "flex",
          }}>
            Level
            {/* <div>
            <Typography
              aria-owns={openPro ? 'mouse-over-popover' : undefined}
              aria-haspopup="true"
              onMouseEnter={handlePopoverOpen}
              onMouseLeave={handlePopoverClose}
            >
              <InfoIcon
                sx={{
                  marginLeft: "5px",
                  fontSize: 18
                }}
              ></InfoIcon>
            </Typography>
            <Popover
              id="mouse-over-popover"
              sx={{ pointerEvents: 'none' }}
              open={openPro}
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              onClose={handlePopoverClose}
              disableRestoreFocus
            >
              <Typography sx={{ p: 1 }}>The level obtained by recharging</Typography>
            </Popover>
          </div> */}

          </span>
          <span style={{
            color: "#bfbfc3"
          }}>
            {level}
          </span>
        </div>
      )}

      {
        rebatePercentage && (

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "8px"
          }}>
            <span style={{
              display: "flex",
            }}>
              Commission rate
              {/* <div>
            <Typography
              aria-owns={openPro ? 'mouse-over-popover' : undefined}
              aria-haspopup="true"
              onMouseEnter={handlePopoverOpen}
              onMouseLeave={handlePopoverClose}
            >
              <InfoIcon
                sx={{
                  marginLeft: "5px",
                  fontSize: 18
                }}
              ></InfoIcon>
            </Typography>
            <Popover
              id="mouse-over-popover"
              sx={{ pointerEvents: 'none' }}
              open={openPro}
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              onClose={handlePopoverClose}
              disableRestoreFocus
            >
              <Typography sx={{ p: 1 }}>Proportion of commission earned from your promotion</Typography>
            </Popover>
          </div> */}

            </span>
            <span style={{
              color: "#bfbfc3"
            }}>
              {rebatePercentage}
            </span>
          </div>
        )}


      {
        rewardPoints && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "8px"
          }}>
            <span style={{
              display: "flex",
            }}>
              Bonus points
            </span>
            <span style={{
              color: "#bfbfc3"
            }}>
              {rewardPoints}
            </span>
          </div>
        )
      }
    </div>
  )
}

