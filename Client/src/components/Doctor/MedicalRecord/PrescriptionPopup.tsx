import React, { useState, useEffect } from "react";
import {
  Modal,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  Checkbox,
  Divider,
  TextField,
} from "@mui/material";
import { LocalPharmacy as MedicineIcon } from "@mui/icons-material";
import {
  IMedicalRecord,
  IPrescriptionItem,
} from "../../../types/medicalRecord";

interface PrescriptionPopupProps {
  open: boolean;
  onClose: () => void;
  medicalRecord: IMedicalRecord;
  onSavePrescription: (prescription: IPrescriptionItem[]) => void;
}

const PrescriptionPopup: React.FC<PrescriptionPopupProps> = ({
  open,
  onClose,
  medicalRecord,
  onSavePrescription,
}) => {
  const [selectedMedicines, setSelectedMedicines] = useState<
    IPrescriptionItem[]
  >([]);
  const [suggestedMedicines, setSuggestedMedicines] = useState<string[]>([]);

  useEffect(() => {
    // Parse the treatment text to extract medicine names
    if (medicalRecord?.treatment) {
      const treatmentText = medicalRecord.treatment;
      // Simple regex to match medicine names (you may need to adjust this based on your treatment text format)
      const medicineMatches =
        treatmentText.match(
          /([A-Za-z0-9\s]+)\s*(?:\d+\s*(?:mg|ml|viên|vỉ|hộp))/g
        ) || [];
      setSuggestedMedicines(medicineMatches);
    }
  }, [medicalRecord]);

  const handleMedicineToggle = (medicine: string) => {
    const currentIndex = selectedMedicines.findIndex(
      (item) => item.name === medicine
    );
    const newSelectedMedicines = [...selectedMedicines];

    if (currentIndex === -1) {
      // Add new medicine
      newSelectedMedicines.push({
        name: medicine,
        strength: "",
        form: "",
        dosage: "",
        frequency: "",
        duration: 0,
        quantity: 0,
        instructions: "",
      });
    } else {
      // Remove medicine
      newSelectedMedicines.splice(currentIndex, 1);
    }

    setSelectedMedicines(newSelectedMedicines);
  };

  const handleUpdateMedicine = (
    index: number,
    field: keyof IPrescriptionItem,
    value: string
  ) => {
    const updatedMedicines = [...selectedMedicines];
    updatedMedicines[index] = {
      ...updatedMedicines[index],
      [field]: value,
    };
    setSelectedMedicines(updatedMedicines);
  };

  const handleSave = () => {
    onSavePrescription(selectedMedicines);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="prescription-popup-title"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          maxHeight: "80vh",
          overflowY: "auto",
          borderRadius: 2,
        }}
      >
        <Typography
          id="prescription-popup-title"
          variant="h6"
          component="h2"
          gutterBottom
        >
          <MedicineIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          Kê đơn thuốc từ phương pháp điều trị
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Phương pháp điều trị hiện tại:
          </Typography>
          <Typography
            variant="body1"
            sx={{ bgcolor: "grey.100", p: 2, borderRadius: 1 }}
          >
            {medicalRecord?.treatment || "Chưa có phương pháp điều trị"}
          </Typography>
        </Box>

        <Typography
          variant="h6"
          sx={{
            color: "primary.main",
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 2,
          }}
        >
          <MedicineIcon />
          Danh sách thuốc được đề xuất
        </Typography>
        <List
          sx={{
            bgcolor: "rgb(243 244 246)",
            borderRadius: 2,
            border: "1px solid rgb(229 231 235)",
          }}
        >
          {suggestedMedicines.map((medicine, index) => (
            <React.Fragment key={index}>
              <ListItem
                sx={{
                  flexDirection: "column",
                  alignItems: "stretch",
                  "&:hover": {
                    bgcolor: "rgb(249 250 251)",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Checkbox
                    edge="start"
                    checked={selectedMedicines.some(
                      (item) => item.name === medicine
                    )}
                    onChange={() => handleMedicineToggle(medicine)}
                  />
                  <Typography
                    sx={{
                      fontWeight: 600,
                      color: "rgb(17 24 39)",
                      flex: 1,
                    }}
                  >
                    {medicine}
                  </Typography>
                </Box>

                {selectedMedicines.some((item) => item.name === medicine) && (
                  <Box
                    sx={{
                      pl: 7,
                      pr: 2,
                      mb: 2,
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 2,
                    }}
                  >
                    {/* Thông tin liều dùng */}
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, color: "rgb(107 114 128)" }}
                      >
                        Thông tin liều dùng
                      </Typography>
                      <TextField
                        size="small"
                        label="Liều lượng"
                        fullWidth
                        margin="dense"
                        value={
                          selectedMedicines.find(
                            (item) => item.name === medicine
                          )?.dosage || ""
                        }
                        onChange={(e) => {
                          const index = selectedMedicines.findIndex(
                            (item) => item.name === medicine
                          );
                          handleUpdateMedicine(index, "dosage", e.target.value);
                        }}
                        sx={{ bgcolor: "white" }}
                      />
                      <TextField
                        size="small"
                        label="Tần suất"
                        fullWidth
                        margin="dense"
                        value={
                          selectedMedicines.find(
                            (item) => item.name === medicine
                          )?.frequency || ""
                        }
                        onChange={(e) => {
                          const index = selectedMedicines.findIndex(
                            (item) => item.name === medicine
                          );
                          handleUpdateMedicine(
                            index,
                            "frequency",
                            e.target.value
                          );
                        }}
                        sx={{ bgcolor: "white" }}
                      />
                    </Box>

                    {/* Thông tin thời gian */}
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, color: "rgb(107 114 128)" }}
                      >
                        Thông tin thời gian
                      </Typography>
                      <TextField
                        size="small"
                        label="Thời gian dùng"
                        fullWidth
                        margin="dense"
                        value={
                          selectedMedicines.find(
                            (item) => item.name === medicine
                          )?.duration || ""
                        }
                        onChange={(e) => {
                          const index = selectedMedicines.findIndex(
                            (item) => item.name === medicine
                          );
                          handleUpdateMedicine(
                            index,
                            "duration",
                            e.target.value
                          );
                        }}
                        sx={{ bgcolor: "white" }}
                      />
                      <TextField
                        size="small"
                        label="Hướng dẫn sử dụng"
                        fullWidth
                        margin="dense"
                        value={
                          selectedMedicines.find(
                            (item) => item.name === medicine
                          )?.instructions || ""
                        }
                        onChange={(e) => {
                          const index = selectedMedicines.findIndex(
                            (item) => item.name === medicine
                          );
                          handleUpdateMedicine(
                            index,
                            "instructions",
                            e.target.value
                          );
                        }}
                        sx={{ bgcolor: "white" }}
                      />
                    </Box>
                  </Box>
                )}
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>

        <Box
          sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}
        >
          <Button variant="outlined" onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={selectedMedicines.length === 0}
          >
            Lưu đơn thuốc
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default PrescriptionPopup;
