import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  X as CloseIcon,
  Plus as PlusIcon,
  Trash2 as TrashIcon,
  Pencil as EditIcon,
} from "lucide-react";

interface Medicine {
  id: number;
  drugName: string;
  strength: string;
  form: string;
  dosage: string;
  frequency: number;
  duration: number;
  quantity: number;
  instructions: string;
}

interface IPrescriptionItem {
  name: string;
  strength: string;
  form: string;
  dosage: string;
  frequency: string;
  duration: number;
  quantity: number;
  instructions: string;
}

interface PrescriptionEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (medicines: Medicine[]) => void;
  appointmentId: string;
  suggestedMedicines?: string[];
  prescription?: {
    medications: Array<IPrescriptionItem>;
    notes?: string;
  };
}

const defaultMedicine: Medicine = {
  id: Date.now(),
  drugName: "",
  strength: "",
  form: "viên",
  dosage: "",
  frequency: 1,
  duration: 1,
  quantity: 1,
  instructions: "",
};

const PrescriptionEditDialog: React.FC<PrescriptionEditDialogProps> = ({
  open,
  onClose,
  onSave,
  suggestedMedicines = [],
  prescription,
}) => {
  const [medicines, setMedicines] = useState<Medicine[]>(
    prescription?.medications.map((m) => ({
      id: Date.now(),
      drugName: m.name,
      strength: m.strength,
      form: m.form,
      dosage: m.dosage,
      frequency: parseInt(m.frequency) || 1,
      duration: m.duration,
      quantity: m.quantity,
      instructions: m.instructions,
    })) || []
  );
  const [currentMedicine, setCurrentMedicine] =
    useState<Medicine>(defaultMedicine);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Update medicines when prescription changes
  React.useEffect(() => {
    if (prescription) {
      setMedicines(
        prescription.medications.map((m) => ({
          id: Date.now(),
          drugName: m.name,
          strength: m.strength,
          form: m.form,
          dosage: m.dosage,
          frequency: parseInt(m.frequency) || 1,
          duration: m.duration,
          quantity: m.quantity,
          instructions: m.instructions,
        }))
      );
    }
  }, [prescription]);

  const handleAddMedicine = () => {
    if (editingIndex !== null) {
      // Cập nhật thuốc đang edit
      setMedicines((prev) =>
        prev.map((med, idx) => (idx === editingIndex ? currentMedicine : med))
      );
    } else {
      // Thêm thuốc mới
      setMedicines((prev) => [...prev, currentMedicine]);
    }
    setCurrentMedicine(defaultMedicine);
    setEditingIndex(null);
  };

  const handleEditMedicine = (index: number) => {
    setCurrentMedicine(medicines[index]);
    setEditingIndex(index);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = () => {
    onSave(medicines);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Chỉnh sửa đơn thuốc</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Form thêm/sửa thuốc */}
        <Box
          mb={3}
          sx={{
            backgroundColor: "#ffffff",
            p: 3,
            borderRadius: 2,
            border: "1px solid rgb(229 231 235)",
            boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              color: "rgb(17 24 39)",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <PlusIcon size={20} />
            {editingIndex !== null
              ? "Sửa thông tin thuốc"
              : "Thêm thuốc mới vào đơn"}
          </Typography>

          {/* Form thêm thuốc mới */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 2, color: "rgb(31 41 55)", fontWeight: 600 }}
            >
              Thêm thuốc mới:
            </Typography>

            {/* Hàng 1: Tên thuốc, Hàm lượng, Dạng thuốc */}
            <Box
              display="grid"
              gridTemplateColumns="1fr 1fr 1fr"
              gap={2}
              mb={2}
            >
              <TextField
                label="Tên thuốc *"
                placeholder="Ví dụ: Paracetamol"
                fullWidth
                value={currentMedicine.drugName}
                onChange={(e) =>
                  setCurrentMedicine((prev) => ({
                    ...prev,
                    drugName: e.target.value,
                  }))
                }
                sx={{ bgcolor: "white" }}
              />
              <TextField
                label="Hàm lượng"
                placeholder="Ví dụ: 500mg"
                fullWidth
                value={currentMedicine.strength}
                onChange={(e) =>
                  setCurrentMedicine((prev) => ({
                    ...prev,
                    strength: e.target.value,
                  }))
                }
                sx={{ bgcolor: "white" }}
              />
              <FormControl fullWidth>
                <InputLabel>Dạng thuốc</InputLabel>
                <Select
                  value={currentMedicine.form}
                  onChange={(e) =>
                    setCurrentMedicine((prev) => ({
                      ...prev,
                      form: e.target.value,
                    }))
                  }
                  label="Dạng thuốc"
                  sx={{ bgcolor: "white" }}
                >
                  <MenuItem value="viên">Viên</MenuItem>
                  <MenuItem value="gói">Gói</MenuItem>
                  <MenuItem value="ống">Ống</MenuItem>
                  <MenuItem value="chai">Chai</MenuItem>
                  <MenuItem value="tuýp">Tuýp</MenuItem>
                  <MenuItem value="lọ">Lọ</MenuItem>
                  <MenuItem value="ống tiêm">Ống tiêm</MenuItem>
                  <MenuItem value="miếng">Miếng</MenuItem>
                  <MenuItem value="chai xịt">Chai xịt</MenuItem>
                  <MenuItem value="viên sủi">Viên sủi</MenuItem>
                  <MenuItem value="viên nang">Viên nang</MenuItem>
                  <MenuItem value="viên nén">Viên nén</MenuItem>
                  <MenuItem value="sirô">Sirô</MenuItem>
                  <MenuItem value="thuốc mỡ">Thuốc mỡ</MenuItem>
                  <MenuItem value="thuốc nhỏ mắt">Thuốc nhỏ mắt</MenuItem>
                  <MenuItem value="thuốc nhỏ mũi">Thuốc nhỏ mũi</MenuItem>
                  <MenuItem value="dung dịch">Dung dịch</MenuItem>
                  <MenuItem value="bột">Bột</MenuItem>
                  <MenuItem value="khác">Khác</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Hàng 2: Liều dùng, Số lần/ngày, Số ngày */}
            <Box
              display="grid"
              gridTemplateColumns="1fr 1fr 1fr"
              gap={2}
              mb={2}
            >
              <TextField
                label="Liều dùng"
                placeholder="Ví dụ: 1 viên"
                fullWidth
                value={currentMedicine.dosage}
                onChange={(e) =>
                  setCurrentMedicine((prev) => ({
                    ...prev,
                    dosage: e.target.value,
                  }))
                }
                sx={{ bgcolor: "white" }}
              />
              <FormControl fullWidth>
                <InputLabel>Số lần/ngày</InputLabel>
                <Select
                  value={currentMedicine.frequency}
                  onChange={(e) =>
                    setCurrentMedicine((prev) => ({
                      ...prev,
                      frequency: Number(e.target.value),
                    }))
                  }
                  label="Số lần/ngày"
                  sx={{ bgcolor: "white" }}
                >
                  <MenuItem value={1}>1 lần/ngày</MenuItem>
                  <MenuItem value={2}>2 lần/ngày</MenuItem>
                  <MenuItem value={3}>3 lần/ngày</MenuItem>
                  <MenuItem value={4}>4 lần/ngày</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Số ngày"
                type="number"
                inputProps={{ min: 1 }}
                fullWidth
                value={currentMedicine.duration}
                onChange={(e) =>
                  setCurrentMedicine((prev) => ({
                    ...prev,
                    duration: Math.max(1, parseInt(e.target.value) || 1),
                  }))
                }
                sx={{ bgcolor: "white" }}
              />
            </Box>

            {/* Hàng 3: Hướng dẫn sử dụng */}
            <Box mb={2}>
              <TextField
                label="Hướng dẫn sử dụng"
                placeholder="Ví dụ: Uống sau ăn, tránh ánh nắng..."
                fullWidth
                multiline
                rows={2}
                value={currentMedicine.instructions}
                onChange={(e) =>
                  setCurrentMedicine((prev) => ({
                    ...prev,
                    instructions: e.target.value,
                  }))
                }
                sx={{ bgcolor: "white" }}
              />
            </Box>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              startIcon={<PlusIcon />}
              onClick={handleAddMedicine}
              sx={{
                bgcolor: "#0085FF",
                "&:hover": {
                  bgcolor: "#0062CC",
                },
              }}
              disabled={!currentMedicine.drugName || !currentMedicine.dosage}
            >
              {editingIndex !== null ? "Cập nhật thuốc" : "Thêm thuốc vào đơn"}
            </Button>
          </Box>
        </Box>

        {/* Danh sách thuốc đã thêm */}
        <Box>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "rgb(17 24 39)",
              fontWeight: 600,
            }}
          >
            <PlusIcon size={20} />
            Danh sách thuốc trong đơn ({medicines.length})
          </Typography>

          <List
            sx={{
              bgcolor: "#ffffff",
              borderRadius: 2,
              border: "1px solid rgb(229 231 235)",
              boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
            }}
          >
            {medicines.map((medicine, index) => (
              <React.Fragment key={index}>
                <ListItem
                  sx={{
                    "&:hover": {
                      bgcolor: "rgb(249 250 251)",
                    },
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <Box sx={{ width: "100%", pr: 16 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Box
                        component="span"
                        sx={{
                          fontWeight: 600,
                          color: "rgb(17 24 39)",
                          fontSize: "0.975rem",
                        }}
                      >
                        {medicine.drugName}
                      </Box>
                      {medicine.strength && (
                        <Box
                          component="span"
                          sx={{
                            color: "#0085FF",
                            ml: 1,
                            fontSize: "0.875rem",
                            px: 1.5,
                            py: 0.5,
                            bgcolor: "#F5FAFF",
                            borderRadius: 1,
                          }}
                        >
                          {medicine.strength}
                        </Box>
                      )}
                    </Box>
                    <Box
                      sx={{
                        mt: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          color: "rgb(55 65 81)",
                          fontSize: "0.875rem",
                          "& > span": {
                            px: 1.5,
                            py: 0.5,
                            bgcolor: "rgb(243 244 246)",
                            borderRadius: 1,
                          },
                        }}
                      >
                        <span>
                          {medicine.dosage} {medicine.form}
                        </span>
                        <span>{medicine.frequency} lần/ngày</span>
                        <span>{medicine.duration} ngày</span>
                      </Box>
                      {medicine.instructions && (
                        <Box
                          sx={{
                            color: "#666666",
                            fontSize: "0.875rem",
                            p: 1.5,
                            bgcolor: "#F5FAFF",
                            borderRadius: 1,
                            border: "1px solid #CCE5FF",
                            fontStyle: "italic",
                          }}
                        >
                          {medicine.instructions}
                        </Box>
                      )}
                    </Box>
                  </Box>
                  <ListItemSecondaryAction sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleEditMedicine(index)}
                      startIcon={<EditIcon size={16} />}
                      sx={{
                        color: "#0085FF",
                        borderColor: "#CCE5FF",
                        "&:hover": {
                          bgcolor: "#F5FAFF",
                          borderColor: "#0085FF",
                        },
                      }}
                    >
                      Sửa
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleRemoveMedicine(index)}
                      startIcon={<TrashIcon size={16} />}
                      sx={{
                        color: "#FF3B3B",
                        borderColor: "#FFD1D1",
                        "&:hover": {
                          bgcolor: "#FFF5F5",
                          borderColor: "#FF3B3B",
                        },
                      }}
                    >
                      Xóa
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < medicines.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Box>

        {/* Danh sách thuốc gợi ý */}
        {suggestedMedicines.length > 0 && (
          <Box mt={3}>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "rgb(17 24 39)",
                fontWeight: 600,
              }}
            >
              <PlusIcon size={20} />
              Thuốc được đề xuất
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
                      "&:hover": {
                        bgcolor: "rgb(249 250 251)",
                      },
                    }}
                  >
                    <Box sx={{ color: "rgb(55 65 81)" }}>{medicine}</Box>
                  </ListItem>
                  {index < suggestedMedicines.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Hủy
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={medicines.length === 0}
        >
          Lưu đơn thuốc
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrescriptionEditDialog;
