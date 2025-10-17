import React, { useState, useEffect, useCallback } from "react";
import {
  History,
  Heart,
  AlertTriangle,
  Baby,
  TestTube,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import {
  PatientMedicalHistory,
  getPatientMedicalHistoryForDoctor,
} from "../../../api/medicalRecordApi";

interface PatientHistoryPanelProps {
  patientId: string;
  doctorId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PatientHistoryPanel: React.FC<PatientHistoryPanelProps> = ({
  patientId,
  doctorId,
  isOpen,
  onClose,
}) => {
  const [history, setHistory] = useState<PatientMedicalHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    medicalHistory: true,
    allergies: true,
    pregnancyInfo: false,
    previousDiagnoses: true,
    vitalsHistory: false,
    importantTests: false,
  });

  const loadPatientHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPatientMedicalHistoryForDoctor(patientId, doctorId);
      setHistory(data);
    } catch (err) {
      setError("Không thể tải tiền sử bệnh án");
      console.error("Error loading patient history:", err);
    } finally {
      setLoading(false);
    }
  }, [patientId, doctorId]);

  useEffect(() => {
    if (isOpen && patientId && doctorId) {
      loadPatientHistory();
    }
  }, [isOpen, patientId, doctorId, loadPatientHistory]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <History className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Tiền Sử Bệnh Án
              </h2>
              <p className="text-sm text-gray-600">
                {history?.totalRecords || 0} lần khám trước đây
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="sr-only">Đóng</span>×
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Đang tải tiền sử...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {history && (
            <div className="space-y-6">
              {/* Tiền sử bệnh tật */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection("medicalHistory")}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-red-500" />
                    <span className="font-medium text-gray-900">
                      Tiền sử bệnh tật
                    </span>
                  </div>
                  {expandedSections.medicalHistory ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {expandedSections.medicalHistory && (
                  <div className="px-4 pb-4 space-y-3">
                    {history.consolidatedHistory.medicalHistory
                      .pastMedicalHistory && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Bệnh sử:
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {
                            history.consolidatedHistory.medicalHistory
                              .pastMedicalHistory
                          }
                        </p>
                      </div>
                    )}
                    {history.consolidatedHistory.medicalHistory
                      .surgicalHistory && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Tiền sử phẫu thuật:
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {
                            history.consolidatedHistory.medicalHistory
                              .surgicalHistory
                          }
                        </p>
                      </div>
                    )}
                    {history.consolidatedHistory.medicalHistory
                      .familyHistory && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Tiền sử gia đình:
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {
                            history.consolidatedHistory.medicalHistory
                              .familyHistory
                          }
                        </p>
                      </div>
                    )}
                    {history.consolidatedHistory.medicalHistory
                      .socialHistory && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Tiền sử xã hội:
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {
                            history.consolidatedHistory.medicalHistory
                              .socialHistory
                          }
                        </p>
                      </div>
                    )}
                    {history.consolidatedHistory.riskFactors && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Yếu tố nguy cơ:
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {history.consolidatedHistory.riskFactors}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dị ứng và thuốc hiện tại */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection("allergies")}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <span className="font-medium text-gray-900">
                      Dị ứng & Thuốc hiện tại
                    </span>
                  </div>
                  {expandedSections.allergies ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {expandedSections.allergies && (
                  <div className="px-4 pb-4 space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Có dị ứng:
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {history.consolidatedHistory.currentAllergies
                          .hasAllergies
                          ? "Có"
                          : "Không"}
                      </p>
                    </div>
                    {history.consolidatedHistory.currentAllergies
                      .allergyList && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Danh sách dị ứng:
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {
                            history.consolidatedHistory.currentAllergies
                              .allergyList
                          }
                        </p>
                      </div>
                    )}
                    {history.consolidatedHistory.currentMedications && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Thuốc đang dùng:
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {history.consolidatedHistory.currentMedications}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Thai sản (nếu là nữ giới) */}
              {(history.consolidatedHistory.pregnancyInfo.isPregnant ||
                history.consolidatedHistory.pregnancyInfo.isBreastfeeding ||
                history.consolidatedHistory.pregnancyInfo.gestationalWeeks) && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection("pregnancyInfo")}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Baby className="h-5 w-5 text-pink-500" />
                      <span className="font-medium text-gray-900">
                        Thông tin thai sản
                      </span>
                    </div>
                    {expandedSections.pregnancyInfo ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  {expandedSections.pregnancyInfo && (
                    <div className="px-4 pb-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Đang mang thai:
                          </label>
                          <p className="text-sm text-gray-900 mt-1">
                            {history.consolidatedHistory.pregnancyInfo
                              .isPregnant
                              ? "Có"
                              : "Không"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Đang cho con bú:
                          </label>
                          <p className="text-sm text-gray-900 mt-1">
                            {history.consolidatedHistory.pregnancyInfo
                              .isBreastfeeding
                              ? "Có"
                              : "Không"}
                          </p>
                        </div>
                      </div>
                      {history.consolidatedHistory.pregnancyInfo
                        .gestationalWeeks && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Tuần thai:
                          </label>
                          <p className="text-sm text-gray-900 mt-1">
                            {
                              history.consolidatedHistory.pregnancyInfo
                                .gestationalWeeks
                            }{" "}
                            tuần
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Chẩn đoán trước đây */}
              {history.consolidatedHistory.previousDiagnoses.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection("previousDiagnoses")}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <span className="font-medium text-gray-900">
                        Chẩn đoán trước đây (
                        {history.consolidatedHistory.previousDiagnoses.length})
                      </span>
                    </div>
                    {expandedSections.previousDiagnoses ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  {expandedSections.previousDiagnoses && (
                    <div className="px-4 pb-4">
                      <div className="space-y-3">
                        {history.consolidatedHistory.previousDiagnoses.map(
                          (diagnosis, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 p-3 rounded-lg"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">
                                    {diagnosis.diagnosis}
                                  </p>
                                  {diagnosis.icdCodes.length > 0 && (
                                    <p className="text-sm text-blue-600 mt-1">
                                      ICD: {diagnosis.icdCodes.join(", ")}
                                    </p>
                                  )}
                                  {diagnosis.treatment && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      Điều trị: {diagnosis.treatment}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right text-sm text-gray-500">
                                  <p>{formatDate(diagnosis.date)}</p>
                                  <p>BS. {diagnosis.doctor}</p>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Vitals History */}
              {history.consolidatedHistory.vitalsHistory.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection("vitalsHistory")}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-gray-900">
                        Diễn biến sinh hiệu (3 lần gần nhất)
                      </span>
                    </div>
                    {expandedSections.vitalsHistory ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  {expandedSections.vitalsHistory && (
                    <div className="px-4 pb-4">
                      <div className="space-y-3">
                        {history.consolidatedHistory.vitalsHistory.map(
                          (vital, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 p-3 rounded-lg"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {formatDate(vital.date)}
                                </span>
                                <span className="text-sm text-gray-500">
                                  BS. {vital.doctor}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                {typeof vital.vitals.temperature !==
                                  "undefined" &&
                                  vital.vitals.temperature !== null && (
                                    <div>
                                      <span className="text-gray-600">
                                        Nhiệt độ:{" "}
                                      </span>
                                      <span className="text-gray-900">
                                        {String(vital.vitals.temperature)}°C
                                      </span>
                                    </div>
                                  )}
                                {typeof vital.vitals.bloodPressure !==
                                  "undefined" &&
                                  vital.vitals.bloodPressure !== null && (
                                    <div>
                                      <span className="text-gray-600">
                                        HA:{" "}
                                      </span>
                                      <span className="text-gray-900">
                                        {String(vital.vitals.bloodPressure)}
                                      </span>
                                    </div>
                                  )}
                                {(typeof vital.vitals.heartRate === "number" ||
                                  typeof vital.vitals.pulse === "number") && (
                                  <div>
                                    <span className="text-gray-600">
                                      Mạch:{" "}
                                    </span>
                                    <span className="text-gray-900">
                                      {typeof vital.vitals.heartRate ===
                                      "number"
                                        ? String(vital.vitals.heartRate)
                                        : String(vital.vitals.pulse)}{" "}
                                      bpm
                                    </span>
                                  </div>
                                )}
                                {typeof vital.vitals.weight !== "undefined" &&
                                  vital.vitals.weight !== null && (
                                    <div>
                                      <span className="text-gray-600">
                                        Cân nặng:{" "}
                                      </span>
                                      <span className="text-gray-900">
                                        {String(vital.vitals.weight)} kg
                                      </span>
                                    </div>
                                  )}
                                {typeof vital.vitals.height !== "undefined" &&
                                  vital.vitals.height !== null && (
                                    <div>
                                      <span className="text-gray-600">
                                        Chiều cao:{" "}
                                      </span>
                                      <span className="text-gray-900">
                                        {String(vital.vitals.height)} cm
                                      </span>
                                    </div>
                                  )}
                                {(typeof vital.vitals.oxygenSaturation ===
                                  "number" ||
                                  typeof vital.vitals.spO2 === "number") && (
                                  <div>
                                    <span className="text-gray-600">
                                      SpO2:{" "}
                                    </span>
                                    <span className="text-gray-900">
                                      {typeof vital.vitals.oxygenSaturation ===
                                      "number"
                                        ? String(vital.vitals.oxygenSaturation)
                                        : String(vital.vitals.spO2)}
                                      %
                                    </span>
                                  </div>
                                )}
                                {typeof vital.vitals.bmi !== "undefined" &&
                                  vital.vitals.bmi !== null && (
                                    <div>
                                      <span className="text-gray-600">
                                        BMI:{" "}
                                      </span>
                                      <span className="text-gray-900">
                                        {String(vital.vitals.bmi)}
                                      </span>
                                    </div>
                                  )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CLS quan trọng */}
              {history.consolidatedHistory.importantTests.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection("importantTests")}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <TestTube className="h-5 w-5 text-purple-500" />
                      <span className="font-medium text-gray-900">
                        CLS quan trọng (
                        {history.consolidatedHistory.importantTests.length})
                      </span>
                    </div>
                    {expandedSections.importantTests ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  {expandedSections.importantTests && (
                    <div className="px-4 pb-4">
                      <div className="space-y-3">
                        {history.consolidatedHistory.importantTests.map(
                          (test, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 p-3 rounded-lg"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-gray-900 capitalize">
                                  {test.type === "laboratory"
                                    ? "Xét nghiệm"
                                    : "Chẩn đoán hình ảnh"}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {formatDate(test.date)} - BS. {test.doctor}
                                </span>
                              </div>
                              <div className="text-sm text-gray-700">
                                {test.tests.join(", ")}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientHistoryPanel;
