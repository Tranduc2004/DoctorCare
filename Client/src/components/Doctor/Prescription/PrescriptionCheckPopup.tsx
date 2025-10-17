import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  Divider,
  IconButton,
} from "@mui/material";
import { X as CloseIcon, Plus as PlusIcon } from "lucide-react";

interface PrescriptionMedicine {
  name: string;
  strength: string;
  form: string;
  dosage: string;
  frequency: string;
  duration: number;
  quantity: number;
  instructions: string;
}

interface PrescriptionCheckPopupProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onModifyPrescription: () => void;
  treatment?: string;
  prescription?: {
    medications: PrescriptionMedicine[];
    notes?: string;
  };
}

const PrescriptionCheckPopup: React.FC<PrescriptionCheckPopupProps> = ({
  open,
  onClose,
  onConfirm,
  onModifyPrescription,
  treatment,
  prescription,
}) => {
  // Phân tích text điều trị để tìm các thuốc được đề xuất
  const extractMedicines = (treatmentText?: string) => {
    if (!treatmentText) return [];

    // Regex để match các tên thuốc và liều lượng
    // Giả sử format là: [Tên thuốc] [liều lượng] [đơn vị]
    const medicineRegex = /([A-Za-z0-9\s]+)\s*(?:\d+\s*(?:mg|ml|viên|vỉ|hộp))/g;
    const matches = treatmentText.match(medicineRegex) || [];
    return matches;
  };

  const suggestedMedicines = extractMedicines(treatment);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background:
            "linear-gradient(to bottom right, #EBF8FF, #E6FFFA, #F0FDF4)",
          borderRadius: "0.75rem",
          border: "1px solid rgb(226 232 240)",
          boxShadow:
            "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: "1px solid rgb(226 232 240)",
          background:
            "linear-gradient(to right, rgb(59 130 246), rgb(45 212 191))",
          color: "white",
          px: 3,
          py: 2,
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography
            variant="h6"
            sx={{ fontSize: "1.25rem", fontWeight: 600 }}
          >
            Xác nhận đơn thuốc
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box
          mb={4}
          sx={{
            bgcolor: "white",
            p: 3,
            borderRadius: "0.75rem",
            border: "1px solid rgb(226 232 240)",
            boxShadow:
              "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 2,
            }}
          >
            <Box
              sx={{
                bgcolor: "rgb(224 242 254)",
                color: "rgb(2 132 199)",
                px: 1.5,
                py: 0.5,
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              Điều trị
            </Box>
            <Typography
              variant="subtitle1"
              sx={{
                color: "rgb(15 23 42)",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              Phương pháp điều trị đã ghi:
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              bgcolor: "rgb(248 250 252)",
              p: 2,
              borderRadius: "0.5rem",
              whiteSpace: "pre-wrap",
              color: "rgb(71 85 105)",
              border: "1px solid rgb(226 232 240)",
            }}
          >
            {treatment || "Chưa có phương pháp điều trị"}
          </Typography>
        </Box>

        {/* Đơn thuốc hiện tại */}
        {prescription && prescription.medications.length > 0 && (
          <Box
            mb={4}
            sx={{
              bgcolor: "white",
              p: 3,
              borderRadius: "0.75rem",
              border: "1px solid rgb(226 232 240)",
              boxShadow:
                "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 2,
              }}
            >
              <Box
                sx={{
                  bgcolor: "rgb(224 242 254)",
                  color: "rgb(2 132 199)",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                Đơn thuốc
              </Box>
              <Typography
                variant="subtitle1"
                sx={{
                  color: "rgb(2 132 199)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}
              >
                Đơn thuốc hiện tại ({prescription.medications.length} thuốc):
              </Typography>
            </Box>

            <List
              sx={{
                bgcolor: "rgb(248 250 252)",
                borderRadius: "0.5rem",
                border: "1px solid rgb(226 232 240)",
                "& .MuiListItem-root": {
                  flexDirection: "column",
                  alignItems: "stretch",
                  gap: 1,
                  py: 2,
                },
              }}
            >
              {prescription.medications.map((med, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{
                          bgcolor: "rgb(224 242 254)",
                          color: "rgb(2 132 199)",
                          px: 1.5,
                          py: 0.5,
                          borderRadius: "0.375rem",
                          fontSize: "0.875rem",
                          fontWeight: 500,
                        }}
                      >
                        Thuốc {index + 1}
                      </Box>
                      <Typography
                        sx={{
                          color: "rgb(15 23 42)",
                          fontWeight: 600,
                          fontSize: "0.9375rem",
                        }}
                      >
                        {med.name}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr 1fr",
                          sm: "1fr 1fr 1fr",
                        },
                        gap: 2,
                        mb: 1,
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            color: "rgb(100 116 139)",
                            mb: 0.5,
                          }}
                        >
                          Hàm lượng
                        </Typography>
                        <Typography sx={{ color: "rgb(51 65 85)" }}>
                          {med.strength}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            color: "rgb(100 116 139)",
                            mb: 0.5,
                          }}
                        >
                          Dạng bào chế
                        </Typography>
                        <Typography sx={{ color: "rgb(51 65 85)" }}>
                          {med.form}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            color: "rgb(100 116 139)",
                            mb: 0.5,
                          }}
                        >
                          Liều dùng
                        </Typography>
                        <Typography sx={{ color: "rgb(51 65 85)" }}>
                          {med.dosage}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            color: "rgb(100 116 139)",
                            mb: 0.5,
                          }}
                        >
                          Tần suất
                        </Typography>
                        <Typography sx={{ color: "rgb(51 65 85)" }}>
                          {med.frequency}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            color: "rgb(100 116 139)",
                            mb: 0.5,
                          }}
                        >
                          Thời gian
                        </Typography>
                        <Typography sx={{ color: "rgb(51 65 85)" }}>
                          {med.duration} ngày
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            color: "rgb(100 116 139)",
                            mb: 0.5,
                          }}
                        >
                          Số lượng
                        </Typography>
                        <Typography sx={{ color: "rgb(51 65 85)" }}>
                          {med.quantity} {med.form}
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        bgcolor: "rgb(243 244 246)",
                        p: 1.5,
                        borderRadius: "0.375rem",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.75rem",
                          color: "rgb(100 116 139)",
                          mb: 0.5,
                        }}
                      >
                        Hướng dẫn sử dụng
                      </Typography>
                      <Typography sx={{ color: "rgb(51 65 85)" }}>
                        {med.instructions}
                      </Typography>
                    </Box>
                  </ListItem>
                  {index < prescription.medications.length - 1 && (
                    <Divider sx={{ my: 1 }} />
                  )}
                </React.Fragment>
              ))}
            </List>
            {prescription.notes && (
              <Box
                mt={2}
                p={2}
                sx={{
                  bgcolor: "rgb(248 250 252)",
                  borderRadius: "0.5rem",
                  border: "1px solid rgb(226 232 240)",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    color: "rgb(100 116 139)",
                    mb: 0.5,
                  }}
                >
                  Ghi chú kê đơn
                </Typography>
                <Typography sx={{ color: "rgb(71 85 105)" }}>
                  {prescription.notes}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Thuốc đề xuất từ phương pháp điều trị */}
        {suggestedMedicines.length > 0 && !prescription?.medications.length && (
          <Box
            sx={{
              bgcolor: "white",
              p: 3,
              borderRadius: "0.75rem",
              border: "1px solid rgb(226 232 240)",
              boxShadow:
                "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 2,
              }}
            >
              <Box
                sx={{
                  bgcolor: "rgb(254 243 199)",
                  color: "rgb(180 83 9)",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                Đề xuất
              </Box>
              <Typography
                variant="subtitle1"
                sx={{
                  color: "rgb(15 23 42)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}
              >
                Danh sách thuốc được đề xuất từ phương pháp điều trị:
              </Typography>
            </Box>
            <List
              sx={{
                bgcolor: "rgb(248 250 252)",
                borderRadius: "0.5rem",
                border: "1px solid rgb(226 232 240)",
              }}
            >
              {suggestedMedicines.map((medicine, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <Box sx={{ color: "rgb(51 65 85)" }}>{medicine}</Box>
                  </ListItem>
                  {index < suggestedMedicines.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}

        <Box mt={3}>
          <Typography
            variant="body2"
            sx={{
              color: "rgb(71 85 105)",
              textAlign: "center",
              bgcolor: "rgb(248 250 252)",
              p: 2,
              borderRadius: "0.5rem",
              border: "1px solid rgb(226 232 240)",
            }}
          >
            Bạn có thể xác nhận kê đơn với các thuốc được đề xuất hoặc chỉnh sửa
            chi tiết đơn thuốc.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          borderTop: "1px solid rgb(226 232 240)",
          bgcolor: "white",
          borderBottomLeftRadius: "0.75rem",
          borderBottomRightRadius: "0.75rem",
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: "rgb(226 232 240)",
            color: "rgb(71 85 105)",
            "&:hover": {
              borderColor: "rgb(203 213 225)",
              bgcolor: "rgb(248 250 252)",
            },
          }}
        >
          Đóng
        </Button>
        <Button
          onClick={onModifyPrescription}
          variant="contained"
          sx={{
            bgcolor: "rgb(59 130 246)",
            "&:hover": {
              bgcolor: "rgb(29 78 216)",
            },
            mr: 1,
          }}
          startIcon={<PlusIcon />}
        >
          Chỉnh sửa đơn thuốc
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            background:
              "linear-gradient(to right, rgb(59 130 246), rgb(45 212 191))",
            "&:hover": {
              background:
                "linear-gradient(to right, rgb(29 78 216), rgb(15 118 110))",
            },
            "&:disabled": {
              background: "rgb(203 213 225)",
            },
          }}
          disabled={!treatment}
        >
          Xác nhận kê đơn
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrescriptionCheckPopup;
