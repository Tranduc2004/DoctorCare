import { useState, useEffect, useMemo } from "react";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import {
  adminGetInsuranceVerifications,
  adminVerifyInsurance,
} from "../../api/adminApi";
import type { Insurance, Patient } from "../../types/admin";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Container,
  Paper,
  Stack,
  TextField,
  MenuItem,
  Box,
  Chip,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  LinearProgress,
  Divider,
  Link,
} from "@mui/material";
import Refresh from "@mui/icons-material/Refresh";
import Search from "@mui/icons-material/Search";
import Check from "@mui/icons-material/Check";
import Close from "@mui/icons-material/Close";
import Visibility from "@mui/icons-material/Visibility";
import Verified from "@mui/icons-material/Verified";
import HourglassEmpty from "@mui/icons-material/HourglassEmpty";
import DoneAll from "@mui/icons-material/DoneAll";
import Block from "@mui/icons-material/Block";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";

// Dùng type cục bộ để tránh lỗi version @mui/x-data-grid
interface GridColDef {
  field: string;
  headerName: string;
  width?: number;
  flex?: number;
  minWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  valueGetter?: (params: any) => any;
  renderCell?: (params: any) => React.ReactNode;
}

interface InsuranceWithPatient extends Insurance {
  patient: Patient;
}

type VerifyStatus = "approved" | "rejected";

type FilterStatus = "pending" | "approved" | "rejected" | "";

const statusColor = (s?: string) => {
  switch (s) {
    case "approved":
      return "success" as const;
    case "rejected":
      return "error" as const;
    case "pending":
    default:
      return "warning" as const;
  }
};

const statusLabel = (s?: string) => {
  switch (s) {
    case "approved":
      return "ĐÃ DUYỆT";
    case "rejected":
      return "TỪ CHỐI";
    case "pending":
    default:
      return "CHỜ DUYỆT";
  }
};

const formatDate = (d?: string | Date | null) => {
  if (!d) return "N/A";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "N/A";
  return dt.toLocaleDateString("vi-VN");
};

const buildImageUrl = (imageUrl?: string | null) => {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  // For Cloudinary URLs, return as is
  if (imageUrl.includes("cloudinary.com")) return imageUrl;
  // For local uploads, construct URL
  const base =
    (import.meta as any)?.env?.VITE_API_URL || window.location.origin;
  return `${base.replace(/\/$/, "")}/${String(imageUrl).replace(/^\//, "")}`;
};

export default function InsuranceVerificationAdmin() {
  const { token } = useAdminAuth();
  const [rows, setRows] = useState<InsuranceWithPatient[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [snack, setSnack] = useState<{
    open: boolean;
    msg: string;
    sev: "success" | "error" | "info";
  }>({ open: false, msg: "", sev: "success" });

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInsurance, setSelectedInsurance] =
    useState<InsuranceWithPatient | null>(null);
  const [verificationStatus, setVerificationStatus] =
    useState<VerifyStatus>("approved");
  const [rejectionReason, setRejectionReason] = useState("");

  // Debounce tìm kiếm
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedQuery(query.trim().toLowerCase()),
      300
    );
    return () => clearTimeout(t);
  }, [query]);

  const refresh = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const response = await adminGetInsuranceVerifications(
        token,
        selectedStatus || undefined
      );
      const list: InsuranceWithPatient[] = response?.data?.insurances || [];
      setRows(list);
    } catch (e) {
      console.error(e);
      setError("Không tải được danh sách xác thực BHYT");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedStatus]);

  const filteredRows = useMemo(() => {
    if (!debouncedQuery) return rows;
    return rows.filter((r) => {
      if (!r) return false;
      const hay = [
        r?.patient?.name,
        r?.policyNumber,
        r?.provider,
        String(r?.coverageRate ?? ""),
        r?.verificationStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(debouncedQuery);
    });
  }, [rows, debouncedQuery]);

  const stats = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter(
      (r) => r?.verificationStatus === "pending"
    ).length;
    const approved = rows.filter(
      (r) => r?.verificationStatus === "approved"
    ).length;
    const rejected = rows.filter(
      (r) => r?.verificationStatus === "rejected"
    ).length;
    return { total, pending, approved, rejected };
  }, [rows]);

  const handleOpenDialog = (ins: InsuranceWithPatient) => {
    setSelectedInsurance(ins);
    setVerificationStatus("approved");
    setRejectionReason("");
    setDialogOpen(true);
  };

  const handleSubmitVerification = async () => {
    if (!selectedInsurance) return;
    try {
      await adminVerifyInsurance(token, selectedInsurance._id, {
        verificationStatus,
        rejectionReason:
          verificationStatus === "rejected"
            ? rejectionReason?.trim() || undefined
            : undefined,
      });
      setSnack({
        open: true,
        msg: "Cập nhật trạng thái bảo hiểm thành công",
        sev: "success",
      });
      setDialogOpen(false);
      await refresh();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Gửi xác thực thất bại", sev: "error" });
    }
  };

  if (!token)
    return (
      <Container sx={{ py: 6 }}>
        <Typography>Vui lòng đăng nhập</Typography>
      </Container>
    );

  const columns: GridColDef[] = [
    {
      field: "patient",
      headerName: "Bệnh nhân",
      flex: 1,
      minWidth: 200,
      valueGetter: (p) => p.row?.patient?.name || "-",
      renderCell: (p) => (
        <Stack direction="column" spacing={0.25}>
          <Typography fontWeight={600}>
            {p.row?.patient?.name || "-"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {p.row?.patient?.email || p.row?.patient?.phone || ""}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "policyNumber",
      headerName: "Số thẻ",
      width: 140,
      valueGetter: (p) => p.row?.policyNumber || "-",
    },
    {
      field: "provider",
      headerName: "Đơn vị phát hành",
      flex: 1,
      minWidth: 160,
    },
    {
      field: "coverageRate",
      headerName: "Mức hưởng",
      width: 120,
      valueGetter: (p) =>
        p.row?.coverageRate ? `${p.row.coverageRate}%` : "N/A",
    },
    {
      field: "validTo",
      headerName: "Hiệu lực đến",
      width: 140,
      valueGetter: (p) => formatDate(p.row?.validTo),
    },
    {
      field: "verificationStatus",
      headerName: "Trạng thái",
      width: 150,
      renderCell: (p) => (
        <Chip
          size="small"
          label={statusLabel(p.value)}
          color={statusColor(p.value)}
          variant={p.value === "pending" ? "outlined" : "filled"}
        />
      ),
    },
    {
      field: "actions",
      headerName: "Thao tác",
      width: 220,
      sortable: false,
      filterable: false,
      renderCell: (p) => (
        <Stack direction="row" spacing={1} alignItems="center">
          {p.row?.imageUrl && (
            <Tooltip title="Xem thẻ">
              <IconButton
                size="small"
                onClick={() => {
                  const url = buildImageUrl(p.row?.imageUrl);
                  console.log("Image URL:", p.row?.imageUrl);
                  console.log("Built URL:", url);
                  if (url) window.open(url, "_blank");
                }}
              >
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {p.row?.verificationStatus === "pending" && (
            <Tooltip title="Xác thực">
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleOpenDialog(p.row)}
                >
                  Xác thực
                </Button>
              </span>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: (t) =>
          t.palette.mode === "light" ? "#f6f7fb" : "background.default",
      }}
    >
      {/* AppBar với nền gradient nhẹ */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: "linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)",
          color: "#fff",
        }}
      >
        <Toolbar>
          <Verified sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Xác thực bảo hiểm y tế
          </Typography>
          <Tooltip title="Làm mới">
            <IconButton onClick={refresh} sx={{ color: "#fff" }}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Toolbar>
        {loading && <LinearProgress color="inherit" />}
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Bộ lọc + thống kê nhanh */}
        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <TextField
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm tên bệnh nhân, số thẻ, đơn vị phát hành…"
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, opacity: 0.6 }} />,
                }}
                fullWidth
              />
              <TextField
                select
                label="Trạng thái"
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(e.target.value as FilterStatus)
                }
                sx={{ minWidth: 220 }}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="pending">Chờ duyệt</MenuItem>
                <MenuItem value="approved">Đã duyệt</MenuItem>
                <MenuItem value="rejected">Từ chối</MenuItem>
              </TextField>
            </Stack>
          </Paper>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Paper
              sx={{
                p: 2,
                borderRadius: 3,
                flex: 1,
                background: "linear-gradient(135deg,#e0f7fa,#e3f2fd)",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Verified fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  Tổng hồ sơ
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700}>
                {stats.total}
              </Typography>
            </Paper>
            <Paper
              sx={{
                p: 2,
                borderRadius: 3,
                flex: 1,
                background: "linear-gradient(135deg,#fff3e0,#e3f2fd)",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <HourglassEmpty fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  Chờ duyệt
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700}>
                {stats.pending}
              </Typography>
            </Paper>
            <Paper
              sx={{
                p: 2,
                borderRadius: 3,
                flex: 1,
                background: "linear-gradient(135deg,#e8f5e9,#e3f2fd)",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <DoneAll fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  Đã duyệt
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700}>
                {stats.approved}
              </Typography>
            </Paper>
            <Paper
              sx={{
                p: 2,
                borderRadius: 3,
                flex: 1,
                background: "linear-gradient(135deg,#ffebee,#e3f2fd)",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Block fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  Từ chối
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700}>
                {stats.rejected}
              </Typography>
            </Paper>
          </Stack>
        </Stack>

        {/* Bảng dữ liệu */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mt: 2 }}>
          <div style={{ width: "100%" }}>
            <DataGrid
              autoHeight
              rows={filteredRows
                .filter(Boolean)
                .map((r) => ({ id: r._id, ...r }))}
              columns={columns}
              getRowId={(r: any) => r.id || r._id}
              disableRowSelectionOnClick
              loading={loading}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10, page: 0 } },
              }}
              slots={{ toolbar: GridToolbar }}
              slotProps={{
                toolbar: {
                  showQuickFilter: false,
                  quickFilterProps: { debounceMs: 300 },
                },
              }}
              localeText={{ noRowsLabel: "Không có dữ liệu" }}
              sx={{
                border: 0,
                "& .MuiDataGrid-columnHeaders": { bgcolor: "background.paper" },
                "& .MuiDataGrid-row:hover": {
                  bgcolor: (t) => t.palette.action.hover,
                },
                "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 600 },
              }}
            />
          </div>
        </Paper>
      </Container>

      {/* Dialog xác thực */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Xác thực bảo hiểm</DialogTitle>
        <DialogContent>
          {selectedInsurance ? (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Bệnh nhân
                    </Typography>
                    <Typography fontWeight={600}>
                      {selectedInsurance.patient?.name || "-"}
                    </Typography>

                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Số thẻ BHYT
                    </Typography>
                    <Typography>
                      {selectedInsurance.policyNumber || "N/A"}
                    </Typography>

                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Đơn vị phát hành
                    </Typography>
                    <Typography>
                      {selectedInsurance.provider || "N/A"}
                    </Typography>

                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Mức hưởng
                    </Typography>
                    <Typography>
                      {selectedInsurance.coverageRate
                        ? `${selectedInsurance.coverageRate}%`
                        : "N/A"}
                    </Typography>

                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Hiệu lực
                    </Typography>
                    <Typography>
                      {formatDate(selectedInsurance.validFrom)} –{" "}
                      {formatDate(selectedInsurance.validTo)}
                    </Typography>

                    {selectedInsurance.imageUrl && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          URL: {selectedInsurance.imageUrl}
                        </Typography>
                        <br />
                        <Link
                          href={
                            buildImageUrl(selectedInsurance.imageUrl) ||
                            undefined
                          }
                          target="_blank"
                          rel="noopener"
                        >
                          Xem ảnh đầy đủ
                        </Link>
                      </Box>
                    )}
                  </Box>

                  {selectedInsurance.imageUrl && (
                    <Box
                      sx={{
                        width: { xs: "100%", sm: 220 },
                        alignSelf: "flex-start",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mb: 1, display: "block" }}
                      >
                        Built URL: {buildImageUrl(selectedInsurance.imageUrl)}
                      </Typography>
                      <Box
                        component="img"
                        src={
                          buildImageUrl(selectedInsurance.imageUrl) || undefined
                        }
                        alt="Thẻ BHYT"
                        onError={(e) => {
                          console.error("Image load error:", e);
                          console.error(
                            "Image URL:",
                            buildImageUrl(selectedInsurance.imageUrl)
                          );
                        }}
                        onLoad={() => {
                          console.log(
                            "Image loaded successfully:",
                            buildImageUrl(selectedInsurance.imageUrl)
                          );
                        }}
                        sx={{
                          width: "100%",
                          height: "auto",
                          borderRadius: 2,
                          border: 1,
                          borderColor: "divider",
                        }}
                      />
                    </Box>
                  )}
                </Stack>
              </Paper>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  select
                  label="Trạng thái xác thực"
                  value={verificationStatus}
                  onChange={(e) =>
                    setVerificationStatus(e.target.value as VerifyStatus)
                  }
                  fullWidth
                >
                  <MenuItem value="approved">Duyệt</MenuItem>
                  <MenuItem value="rejected">Từ chối</MenuItem>
                </TextField>

                {verificationStatus === "rejected" && (
                  <TextField
                    label="Lý do từ chối"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    multiline
                    minRows={3}
                    fullWidth
                    required
                  />
                )}
              </Stack>
            </Stack>
          ) : (
            <Typography>Không có dữ liệu bảo hiểm.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button startIcon={<Close />} onClick={() => setDialogOpen(false)}>
            Hủy
          </Button>
          <Button
            startIcon={<Check />}
            onClick={handleSubmitVerification}
            variant="contained"
            color={verificationStatus === "approved" ? "primary" : "error"}
            disabled={
              verificationStatus === "rejected" && !rejectionReason.trim()
            }
          >
            Gửi
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.sev}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>

      {error && (
        <Container sx={{ pb: 3 }}>
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        </Container>
      )}
    </Box>
  );
}
