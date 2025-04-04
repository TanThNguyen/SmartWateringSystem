import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo
} from "react";
import { toast } from "react-toastify";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { FaChevronDown, FaTrashAlt } from "react-icons/fa";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import {
  DeviceStatus,
  DeviceType,
  InfoDevicesType,
  GetDevicesRequestType,
  EditDeviceType,
  AddDeviceType,
  DeviceDetailType,
} from "../../types/device.type";
import { SensorDataRequestType } from "../../types/record.type";
import { InfoLocationType } from "../../types/location.type";
import {
  ConfigurationFilterType,
  ConfigurationDetailType,
} from "../../types/configuration.type";
import {
  ScheduleType,
  CreateSchedulePayload,
  GetSchedulesParams,
  ToggleSchedulePayload,
  DeleteSchedulePayload,
} from "../../types/schedule.type";

import PopupModal from "../../layout/popupmodal";

import "./device.scss";
import { locationApi } from "../../axios/location.api";
import { deviceApi } from "../../axios/device.api";
import { configurationApi } from "../../axios/configuration.api";
import { recordAPI } from "../../axios/record.api";
import { scheduleAPI } from "../../axios/schedule.api";

const calculateRepeatDays = (days: boolean[]): number => {
  return days.reduce((mask, isChecked, index) => isChecked ? mask | (1 << index) : mask, 0);
};

const getRepeatDaysFromMask = (mask: number): boolean[] => {
  return Array.from({ length: 7 }, (_, i) => (mask & (1 << i)) !== 0);
};

const dayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export default function DeviceManagementPage() {
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<InfoDevicesType[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [locations, setLocations] = useState<InfoLocationType[]>([]);
  const locationMap = useMemo(() => {
    return new Map(locations.map(loc => [loc.locationId, loc.name]));
  }, [locations]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'ALL'>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [selectedDeviceInfo, setSelectedDeviceInfo] = useState<DeviceDetailType | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const initialNewDeviceState: AddDeviceType = {
    name: "",
    locationId: "",
    type: DeviceType.PUMP,
    status: DeviceStatus.ACTIVE,
    thresholdId: undefined,
    tempMinId: undefined,
    tempMaxId: undefined,
    humidityThresholdId: undefined,
  };
  const [newDevice, setNewDevice] = useState<AddDeviceType>(initialNewDeviceState);
  const [editDeviceData, setEditDeviceData] = useState<Partial<DeviceDetailType>>({});
  const [configOptions, setConfigOptions] = useState<ConfigurationDetailType[]>([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [temperatureChartData, setTemperatureChartData] = useState<Array<{ time: number, temp: number }>>([]);
  const [humidityChartData, setHumidityChartData] = useState<Array<{ time: number, humidity: number }>>([]);
  const [soilChartData, setSoilChartData] = useState<Array<{ time: number, soil: number }>>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [schedules, setSchedules] = useState<ScheduleType[]>([]);
  const [scheduleTotal, setScheduleTotal] = useState(0);
  const [scheduleCurrentPage, setScheduleCurrentPage] = useState(1);
  const [scheduleItemsPerPage] = useState(5);
  const [scheduleIsActiveFilter] = useState<boolean | 'ALL'>('ALL');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [showAddScheduleForm, setShowAddScheduleForm] = useState(false);
  const initialNewScheduleState: Partial<CreateSchedulePayload> = { isActive: true };
  const [newSchedule, setNewSchedule] = useState<Partial<CreateSchedulePayload>>(initialNewScheduleState);
  const [newScheduleRepeatDays, setNewScheduleRepeatDays] = useState<boolean[]>(Array(7).fill(false));
  const addModalRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);

  const findConfig = useCallback((configId?: string): ConfigurationDetailType | undefined => {
    return configOptions.find(c => c.configId === configId);
  }, [configOptions]);

  const fetchLocations = useCallback(async () => {
    try {
      const response = await locationApi.getAllLocations({ search: "", order: "asc" });
      setLocations(response.locations || []);
    } catch (err) {
      toast.error("Lỗi khi tải danh sách khu vực.");
      console.error("Fetch locations error:", err);
    }
  }, []);

  const fetchDevices = useCallback(async (calledFromAddOrEdit = false) => {
    if (!calledFromAddOrEdit) {
      setLoading(true);
    }
    const params: GetDevicesRequestType = {
      page: currentPage,
      items_per_page: itemsPerPage,
      search: searchText.trim() || undefined,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      locationId: locationFilter || undefined,
      order,
    };
    try {
      const response = await deviceApi.getAllDevices(params);
      setDevices(response.devices);
      setTotalRecords(response.total);
      const maxPage = Math.ceil(response.total / itemsPerPage) || 1;
      if (currentPage > maxPage && response.total > 0) {
        setCurrentPage(maxPage);
      } else if (currentPage <= 0 && response.total > 0) {
        setCurrentPage(1);
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách thiết bị!");
      console.error("Fetch devices error:", error);
      setDevices([]);
      setTotalRecords(0);
    } finally {
      if (!calledFromAddOrEdit) {
        setLoading(false);
      }
    }
  }, [currentPage, itemsPerPage, searchText, statusFilter, locationFilter, order]);

  const fetchConfigurations = useCallback(async (locationId?: string, deviceType?: DeviceType) => {
    const relevantTypes = [DeviceType.MOISTURE_SENSOR, DeviceType.DHT20_SENSOR];
    if (!locationId || !deviceType || !relevantTypes.includes(deviceType)) {
      setConfigOptions([]);
      return;
    }
    setConfigLoading(true);
    try {
      const params: ConfigurationFilterType = { locationId, deviceType };
      const response = await configurationApi.getConfigurationsByFilter(params);
      const configs = Array.isArray(response) ? response : (response?.configurations || []);
      setConfigOptions(configs);
    } catch (error) {
      toast.error(`Lỗi khi tải cấu hình ${deviceType} cho khu vực.`);
      console.error("Fetch configurations error:", error);
      setConfigOptions([]);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  const fetchDeviceChartData = useCallback(async (deviceId: string, deviceType: DeviceType | undefined) => {
    if (!deviceId || !deviceType || ![DeviceType.MOISTURE_SENSOR, DeviceType.DHT20_SENSOR].includes(deviceType)) {
      setSoilChartData([]);
      setTemperatureChartData([]);
      setHumidityChartData([]);
      return;
    }
    setChartLoading(true);
    try {
      const params: SensorDataRequestType = {
        deviceId: deviceId,
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        stop: new Date().toISOString()
      };
      const response = await recordAPI.getDeviceRecords(params);
      if (!response || !Array.isArray(response)) {
        console.warn("Invalid chart data response for device:", deviceId);
        setSoilChartData([]);
        setTemperatureChartData([]);
        setHumidityChartData([]);
        return;
      };
      const processData = (key: 'soilMoisture' | 'temperature' | 'humidity') => response
        .map((record: any) => ({
          time: new Date(record.timestamp).getTime(),
          value: record._avg?.[key] ?? record[key] ?? null
        }))
        .filter(d => !isNaN(d.time) && d.time > 0 && d.value !== null && d.value !== undefined)
        .sort((a, b) => a.time - b.time);

      if (deviceType === DeviceType.MOISTURE_SENSOR) {
        setSoilChartData(processData('soilMoisture').map(d => ({ time: d.time, soil: d.value! })));
        setTemperatureChartData([]);
        setHumidityChartData([]);
      } else if (deviceType === DeviceType.DHT20_SENSOR) {
        setTemperatureChartData(processData('temperature').map(d => ({ time: d.time, temp: d.value! })));
        setHumidityChartData(processData('humidity').map(d => ({ time: d.time, humidity: d.value! })));
        setSoilChartData([]);
      } else {
        setSoilChartData([]);
        setTemperatureChartData([]);
        setHumidityChartData([]);
      }
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu biểu đồ.");
      console.error("Error fetching device chart data:", error);
      setSoilChartData([]);
      setTemperatureChartData([]);
      setHumidityChartData([]);
    } finally {
      setChartLoading(false);
    }
  }, []);

  const fetchSchedules = useCallback(async (deviceId: string) => {
    if (!deviceId) {
      setSchedules([]);
      setScheduleTotal(0);
      return;
    };
    setScheduleLoading(true);
    const params: GetSchedulesParams = {
      deviceId,
      page: scheduleCurrentPage,
      items_per_page: scheduleItemsPerPage,
      isActive: scheduleIsActiveFilter === 'ALL' ? undefined : scheduleIsActiveFilter
    };
    try {
      const response = await scheduleAPI.getSchedules(params);
      setSchedules(response.schedules || []);
      setScheduleTotal(response.total || 0);
      const maxSchedulePage = Math.ceil((response.total || 0) / scheduleItemsPerPage) || 1;
      if (scheduleCurrentPage > maxSchedulePage && response.total > 0) {
        setScheduleCurrentPage(maxSchedulePage);
      } else if (scheduleCurrentPage <= 0 && response.total > 0) {
        setScheduleCurrentPage(1);
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách lịch trình!");
      console.error("Fetch schedules error:", error);
      setSchedules([]);
      setScheduleTotal(0);
    } finally {
      setScheduleLoading(false);
    }
  }, [scheduleCurrentPage, scheduleItemsPerPage, scheduleIsActiveFilter]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    if (showAddForm && newDevice.locationId && newDevice.type) {
      fetchConfigurations(newDevice.locationId, newDevice.type);
    } else if (showAddForm) {
      setConfigOptions([]);
    }
  }, [showAddForm, newDevice.locationId, newDevice.type, fetchConfigurations]);

  useEffect(() => {
    if (!showEditForm) {
      setSelectedDeviceInfo(null);
      setEditDeviceData({});
      setConfigOptions([]);
      setSoilChartData([]);
      setTemperatureChartData([]);
      setHumidityChartData([]);
      setSchedules([]);
      setScheduleTotal(0);
      setScheduleCurrentPage(1);
      setShowAddScheduleForm(false);
      setNewSchedule(initialNewScheduleState);
      setNewScheduleRepeatDays(Array(7).fill(false));
      setModalLoading(false);
      setScheduleLoading(false);
    }
  }, [showEditForm]);

  useEffect(() => {
    if (showEditForm && selectedDeviceInfo?.deviceId && (selectedDeviceInfo.type === DeviceType.PUMP || selectedDeviceInfo.type === DeviceType.FAN)) {
      fetchSchedules(selectedDeviceInfo.deviceId);
    }
  }, [scheduleCurrentPage, showEditForm, selectedDeviceInfo?.deviceId, selectedDeviceInfo?.type, fetchSchedules]);

  useEffect(() => {
    let intervalId = null;
    if (showEditForm && selectedDeviceInfo?.deviceId && (selectedDeviceInfo.type === DeviceType.MOISTURE_SENSOR || selectedDeviceInfo.type === DeviceType.DHT20_SENSOR)) {
      fetchDeviceChartData(selectedDeviceInfo.deviceId, selectedDeviceInfo.type);
      intervalId = setInterval(() => {
        console.log("Auto-refresh chart data for:", selectedDeviceInfo.deviceId);
        fetchDeviceChartData(selectedDeviceInfo.deviceId, selectedDeviceInfo.type);
      }, 300000);
    } else {
      setSoilChartData([]);
      setTemperatureChartData([]);
      setHumidityChartData([]);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [showEditForm, selectedDeviceInfo?.deviceId, selectedDeviceInfo?.type, fetchDeviceChartData]);

  useEffect(() => {
    if (showEditForm && editDeviceData.deviceId) {
    }
  }, [editDeviceData, showEditForm]);

  const handleFilterChange = useCallback((setter: React.Dispatch<React.SetStateAction<any>>) => (value: any) => {
    setter(value);
    setCurrentPage(1);
  }, []);

  const handlePageChange = (newPage: number) => {
    const maxPage = Math.ceil(totalRecords / itemsPerPage) || 1;
    if (newPage >= 1 && newPage <= maxPage) {
      setCurrentPage(newPage);
    }
  };

  const toggleSelectDevice = (deviceId: string) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId]
    );
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedDeviceIds(devices.map(d => d.deviceId));
    } else {
      setSelectedDeviceIds([]);
    }
  };

  const handleOpenAddForm = () => {
    setNewDevice(initialNewDeviceState);
    setConfigOptions([]);
    setShowAddForm(true);
  };

  const handleOpenEditForm = useCallback(async (device: InfoDevicesType) => {
    setShowEditForm(true);
    setModalLoading(true);
    setSelectedDeviceInfo(null);
    setEditDeviceData({});
    setSoilChartData([]);
    setTemperatureChartData([]);
    setHumidityChartData([]);
    setSchedules([]);
    setScheduleTotal(0);
    setScheduleCurrentPage(1);
    setShowAddScheduleForm(false);
    setConfigOptions([]);
    try {
      const detailedDevice = await deviceApi.getOneDevice({ deviceId: device.deviceId });
      if (!detailedDevice) {
        toast.error("Không thể tải chi tiết thiết bị.");
        throw new Error("Device details not found.");
      }
      setSelectedDeviceInfo(detailedDevice);
      setEditDeviceData({
        deviceId: detailedDevice.deviceId,
        name: detailedDevice.name,
        locationId: String(detailedDevice.locationId),
        status: detailedDevice.status,
        type: detailedDevice.type,
        moisture_sensor: detailedDevice.moisture_sensor,
        dht20_sensor: detailedDevice.dht20_sensor
      });
      await fetchConfigurations(String(detailedDevice.locationId), detailedDevice.type);
      if (detailedDevice.type === DeviceType.PUMP || detailedDevice.type === DeviceType.FAN) {
        fetchSchedules(detailedDevice.deviceId);
      }
    } catch (error) {
      toast.error("Lỗi khi tải chi tiết thiết bị!");
      console.error("Get one device error:", error);
      handleCloseModals();
    }
    finally {
      setModalLoading(false);
    }
  }, [fetchConfigurations, fetchSchedules]);

  const handleCloseModals = () => {
    setShowAddForm(false);
    setShowEditForm(false);
  };

  const handleNewDeviceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewDevice((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'type' || name === 'locationId') {
        updated.thresholdId = undefined;
        updated.tempMinId = undefined;
        updated.tempMaxId = undefined;
        updated.humidityThresholdId = undefined;
      }
      return updated;
    });
  };

  const handleEditDeviceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditDeviceData((prev) => ({ ...prev, [name]: value }));
    if (name === 'locationId' && selectedDeviceInfo) {
      fetchConfigurations(value, selectedDeviceInfo.type);
      setEditDeviceData(prev => ({
        ...prev,
        locationId: value,
        ...(selectedDeviceInfo.type === DeviceType.MOISTURE_SENSOR && { moisture_sensor: { ...(prev.moisture_sensor || {}), thresholdId: undefined } }),
        ...(selectedDeviceInfo.type === DeviceType.DHT20_SENSOR && { dht20_sensor: { ...(prev.dht20_sensor || {}), tempMinId: undefined, tempMaxId: undefined, humidityThresholdId: undefined } })
      }));
    }
  };

  const handleEditConfigChange = (configType: 'thresholdId' | 'tempMinId' | 'tempMaxId' | 'humidityThresholdId', value: string) => {
    setEditDeviceData(prev => {
      const updatedData = { ...prev };
      const currentType = selectedDeviceInfo?.type;
      if (configType === 'thresholdId' && currentType === DeviceType.MOISTURE_SENSOR) {
        updatedData.moisture_sensor = { ...(prev.moisture_sensor || {}), thresholdId: value || undefined };
      } else if (currentType === DeviceType.DHT20_SENSOR) {
        if (configType === 'tempMinId' || configType === 'tempMaxId' || configType === 'humidityThresholdId') {
          updatedData.dht20_sensor = { ...(prev.dht20_sensor || {}), [configType]: value || undefined };
        }
      }
      return updatedData;
    });
  };

  const handleCreateDevice = async () => {
    if (!newDevice.name || !newDevice.locationId) {
      return toast.warn("Vui lòng điền tên và chọn khu vực.");
    }
    if (newDevice.type === DeviceType.MOISTURE_SENSOR && !newDevice.thresholdId) {
      return toast.warn("Vui lòng chọn cấu hình ngưỡng ẩm.");
    }
    if (newDevice.type === DeviceType.DHT20_SENSOR && (!newDevice.tempMinId || !newDevice.tempMaxId || !newDevice.humidityThresholdId)) {
      return toast.warn("Vui lòng chọn đủ 3 cấu hình cho DHT20.");
    }
    setModalLoading(true);
    try {
      await deviceApi.addDevice(newDevice);
      toast.success("Thêm thiết bị thành công!");
      handleCloseModals();
      setCurrentPage(1);
      fetchDevices(true);
    } catch (error) {
      toast.error("Lỗi khi thêm thiết bị!");
      console.error("Create device error:", error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditDevice = async () => {
    if (!editDeviceData.deviceId || !selectedDeviceInfo) {
      return toast.error("Lỗi: Thiếu thông tin thiết bị để cập nhật.");
    };
    const payload: Partial<EditDeviceType> & { deviceId: string } = {
      deviceId: editDeviceData.deviceId,
    };
    if (editDeviceData.name !== selectedDeviceInfo.name) {
      payload.name = editDeviceData.name;
    }
    if (editDeviceData.status !== selectedDeviceInfo.status) {
      payload.status = editDeviceData.status;
    }
    if (String(editDeviceData.locationId) !== String(selectedDeviceInfo.locationId)) {
      payload.locationId = String(editDeviceData.locationId);
    }
    const originalType = selectedDeviceInfo.type;
    if (originalType === DeviceType.MOISTURE_SENSOR) {
      const originalThreshold = selectedDeviceInfo.moisture_sensor?.thresholdId;
      const editedThreshold = editDeviceData.moisture_sensor?.thresholdId;
      if (editedThreshold !== originalThreshold) {
        payload.moisture_sensor = { thresholdId: editedThreshold || undefined };
        if (!payload.moisture_sensor.thresholdId) {
          return toast.warn("Vui lòng chọn cấu hình ngưỡng ẩm.");
        }
      }
    } else if (originalType === DeviceType.DHT20_SENSOR) {
      const originalDHT = selectedDeviceInfo.dht20_sensor;
      const editedDHT = editDeviceData.dht20_sensor;
      const dhtChanged = editedDHT?.tempMinId !== originalDHT?.tempMinId ||
        editedDHT?.tempMaxId !== originalDHT?.tempMaxId ||
        editedDHT?.humidityThresholdId !== originalDHT?.humidityThresholdId;
      if (dhtChanged) {
        payload.dht20_sensor = {
          tempMinId: editedDHT?.tempMinId || undefined,
          tempMaxId: editedDHT?.tempMaxId || undefined,
          humidityThresholdId: editedDHT?.humidityThresholdId || undefined,
        };
        if (!payload.dht20_sensor.tempMinId || !payload.dht20_sensor.tempMaxId || !payload.dht20_sensor.humidityThresholdId) {
          return toast.warn("Vui lòng chọn đủ 3 cấu hình cho DHT20.");
        }
      }
    }
    const keysToUpdate = Object.keys(payload);
    if (keysToUpdate.length <= 1 && keysToUpdate[0] === 'deviceId') {
      toast.info("Không có thay đổi nào để cập nhật.");
      return;
    }
    setModalLoading(true);
    try {
      await deviceApi.editDevice(payload as EditDeviceType);
      toast.success("Cập nhật thiết bị thành công!");
      handleCloseModals();
      fetchDevices(true);
    } catch (error) {
      toast.error("Lỗi khi cập nhật thiết bị!");
      console.error("Update device error:", error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteDevices = async () => {
    if (selectedDeviceIds.length === 0) {
      return;
    }
    if (!window.confirm(`Xóa ${selectedDeviceIds.length} thiết bị đã chọn?`)) {
      return;
    }
    setLoading(true);
    try {
      await deviceApi.deleteDevices({ deviceIds: selectedDeviceIds });
      toast.success(`Đã xóa ${selectedDeviceIds.length} thiết bị.`);
      setSelectedDeviceIds([]);
      const remainingOnPage = devices.filter(d => !selectedDeviceIds.includes(d.deviceId)).length;
      const totalPagesAfterDelete = Math.ceil((totalRecords - selectedDeviceIds.length) / itemsPerPage) || 1;
      if (currentPage > totalPagesAfterDelete) {
        setCurrentPage(totalPagesAfterDelete);
      } else if (remainingOnPage === 0 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        setCurrentPage(Math.max(1, Math.min(currentPage, totalPagesAfterDelete)));
      }
      fetchDevices(true);
    } catch (error) {
      toast.error("Lỗi khi xóa thiết bị!");
      console.error("Delete device error:", error);
      setLoading(false);
    }
  };

  const handleToggleDeviceStatus = async (deviceId: string, currentStatus: DeviceStatus) => {
    const newStatus = currentStatus === DeviceStatus.ACTIVE ? DeviceStatus.INACTIVE : DeviceStatus.ACTIVE;
    setDevices(prev => prev.map(d => d.deviceId === deviceId ? { ...d, status: newStatus } : d));
    try {
      await deviceApi.toggleDeviceStatus({ deviceId });
    } catch (error) {
      toast.error(`Lỗi khi ${newStatus === DeviceStatus.ACTIVE ? "bật" : "tắt"} thiết bị! Hoàn tác.`);
      console.error("Toggle status error:", error);
      setDevices(prev => prev.map(d => d.deviceId === deviceId ? { ...d, status: currentStatus } : d));
    }
  };

  const handleSchedulePageChange = (newPage: number) => {
    const maxPage = Math.ceil(scheduleTotal / scheduleItemsPerPage) || 1;
    if (newPage >= 1 && newPage <= maxPage) {
      setScheduleCurrentPage(newPage);
    }
  };

  const handleNewScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (name === 'repeatDay') {
      const dayIndex = parseInt(value, 10);
      setNewScheduleRepeatDays(prev => {
        const newDays = [...prev];
        newDays[dayIndex] = checked;
        return newDays;
      });
    } else {
      setNewSchedule(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (value || undefined),
      }));
    }
  };

  const handleCreateSchedule = async () => {
    if (!selectedDeviceInfo?.deviceId || !newSchedule.startTime || !newSchedule.endTime) {
      return toast.warn("Vui lòng nhập thời gian bắt đầu và kết thúc.");
    }
    let startTimeISO: string, endTimeISO: string;
    try {
      const startDate = new Date(newSchedule.startTime);
      const endDate = new Date(newSchedule.endTime);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return toast.warn("Định dạng thời gian không hợp lệ.");
      }
      startTimeISO = startDate.toISOString();
      endTimeISO = endDate.toISOString();
      if (endDate <= startDate) {
        return toast.warn("Thời gian kết thúc phải sau thời gian bắt đầu.");
      }
    } catch (e) {
      return toast.warn("Định dạng thời gian không hợp lệ.");
    }
    const payload: CreateSchedulePayload = {
      deviceId: selectedDeviceInfo.deviceId,
      startTime: startTimeISO,
      endTime: endTimeISO,
      repeatDays: calculateRepeatDays(newScheduleRepeatDays),
      isActive: newSchedule.isActive ?? true,
    };
    setScheduleLoading(true);
    try {
      await scheduleAPI.createSchedule(payload);
      toast.success("Thêm lịch trình thành công!");
      setShowAddScheduleForm(false);
      setNewSchedule(initialNewScheduleState);
      setNewScheduleRepeatDays(Array(7).fill(false));
      setScheduleCurrentPage(1);
      fetchSchedules(selectedDeviceInfo.deviceId);
    } catch (error) {
      toast.error("Lỗi khi thêm lịch trình!");
      console.error("Create schedule error:", error);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleToggleSchedule = async (scheduleId: string, deviceId: string) => {
    const originalSchedules = [...schedules];
    setSchedules(prev => prev.map(s => s.scheduleId === scheduleId ? { ...s, isActive: !s.isActive } : s));
    try {
      console.log(scheduleId)
      const response = await scheduleAPI.toggleSchedule({ scheduleId });
      console.log(response)
    } catch (error) {
      toast.error("Lỗi khi thay đổi trạng thái lịch trình! Hoàn tác.");
      console.error("Toggle schedule error:", error);
      setSchedules(originalSchedules);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string, deviceId: string) => {
    if (!window.confirm("Xóa lịch trình này?")) {
      return;
    }
    setScheduleLoading(true);
    try {
      await scheduleAPI.deleteSchedule({ scheduleId });
      toast.success("Đã xóa lịch trình.");
      const remainingOnPage = schedules.filter(s => s.scheduleId !== scheduleId).length;
      const totalPagesAfterDelete = Math.ceil((scheduleTotal - 1) / scheduleItemsPerPage) || 1;
      if (scheduleCurrentPage > totalPagesAfterDelete) {
        setScheduleCurrentPage(totalPagesAfterDelete);
      } else if (remainingOnPage === 0 && scheduleCurrentPage > 1) {
        setScheduleCurrentPage(scheduleCurrentPage - 1);
      } else {
        setScheduleCurrentPage(Math.max(1, Math.min(scheduleCurrentPage, totalPagesAfterDelete)));
      }
      fetchSchedules(deviceId);
    } catch (error) {
      toast.error("Lỗi khi xóa lịch trình!");
      console.error("Delete schedule error:", error);
    } finally {
      setScheduleLoading(false);
    }
  };

  const statusOptions = useMemo(() => [
    { label: "Tất cả trạng thái", value: 'ALL' },
    { label: "Hoạt động", value: DeviceStatus.ACTIVE },
    { label: "Không hoạt động", value: DeviceStatus.INACTIVE },
  ], []);
  const orderOptions = useMemo(() => [
    { label: "Mới nhất", value: "desc" },
    { label: "Cũ nhất", value: "asc" },
  ], []);
  const locationOptions = useMemo(() => [
    { label: "Tất cả khu vực", value: "" },
    ...locations.map(loc => ({ label: loc.name, value: String(loc.locationId) }))
  ], [locations]);
  const deviceTypeOptions = useMemo(() => Object.values(DeviceType).map(type => ({ label: type, value: type })), []);

  const renderDropdown = (
    label: string,
    value: string | 'ALL',
    options: { label: string; value: string | 'ALL' }[],
    onChange: (value: string | 'ALL') => void,
    dropdownWidth = "w-48"
  ) => (
    <div className={`dropdown-trigger-wrapper ${dropdownWidth}`}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="dropdown-trigger">
          <span>
            {options.find((option) => option.value === value)?.label || label}
          </span>
          <FaChevronDown className="dropdown-chevron" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="dropdown-content"
            style={{ minWidth: 'var(--radix-dropdown-menu-trigger-width)' }}
            sideOffset={5}
            align="start"
          >
            {options.map((option) => (
              <DropdownMenu.Item
                key={option.value}
                className="dropdown-item"
                onSelect={() => onChange(option.value)}
              >
                {option.label}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );

  const renderConfigSelect = (
    label: string,
    name: 'thresholdId' | 'tempMinId' | 'tempMaxId' | 'humidityThresholdId',
    currentValue: string | undefined,
    onChangeHandler: (name: 'thresholdId' | 'tempMinId' | 'tempMaxId' | 'humidityThresholdId', value: string) => void,
    unit?: string,
  ) => {
    const selectValue = configOptions.some(cfg => String(cfg.configId) === String(currentValue)) ? String(currentValue) : "";
    return (
      <label className="configLabel">
        {label}:
        <span className="requiredAsterisk">*</span>
        {configLoading ? (
          <p className="loadingText small">Đang tải...</p>
        ) : (
          <div className="configSelectContainer">
            <select
              name={name}
              value={selectValue}
              onChange={(e) => onChangeHandler(name, e.target.value)}
              required
              disabled={configOptions.length === 0}
            >
              <option value="" disabled>-- Chọn cấu hình --</option>
              {configOptions.length > 0 ? (
                configOptions.map(cfg => (
                  <option key={String(cfg.configId)} value={String(cfg.configId)}>
                    {cfg.name} ({cfg.value}{unit || ''})
                  </option>
                ))
              ) : (
                <option value="" disabled>Không có cấu hình</option>
              )}
            </select>
          </div>
        )}
      </label>
    );
  };

  return (
    <div className="container">
      <div className="filterContainer">
        <input
          type="text"
          placeholder="Tìm kiếm tên thiết bị..."
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setCurrentPage(1);
          }}
          className="searchInput"
        />
        {renderDropdown("Trạng thái", statusFilter, statusOptions, handleFilterChange(setStatusFilter), "w-40")}
        {renderDropdown("Sắp xếp", order, orderOptions, handleFilterChange(setOrder), "w-36")}
        {renderDropdown("Khu vực", locationFilter, locationOptions, handleFilterChange(setLocationFilter), "w-48")}
        <button
          onClick={handleOpenAddForm}
          className="button addButton"
        >
          Thêm Mới
        </button>
        <button
          onClick={handleDeleteDevices}
          disabled={selectedDeviceIds.length === 0 || loading}
          className="button deleteButton"
        >
          Xóa ({selectedDeviceIds.length})
        </button>
      </div>

      <div className="tableContainer">
        <div className="tableWrapper">
          <table className="deviceTable">
            <thead>
              <tr>
                <th style={{ width: '5%' }} className="checkboxCell">
                  <input
                    type="checkbox"
                    className="checkboxInput"
                    checked={!loading && devices.length > 0 && selectedDeviceIds.length === devices.length}
                    onChange={handleSelectAll}
                    disabled={loading || devices.length === 0}
                    title="Chọn/Bỏ chọn tất cả"
                  />
                </th>
                <th style={{ width: '30%' }}>Tên</th>
                <th style={{ width: '25%' }}>Khu vực</th>
                <th style={{ width: '20%' }}>Loại</th>
                <th style={{ width: '20%', textAlign: 'center' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="noResults">Đang tải...</td>
                </tr>
              ) : devices.length > 0 ? (
                devices.map((device) => (
                  <tr
                    key={device.deviceId}
                    onClick={() => handleOpenEditForm(device)}
                    className="tableRowClickable"
                    title="Xem chi tiết/Chỉnh sửa"
                  >
                    <td className="checkboxCell" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="checkboxInput"
                        checked={selectedDeviceIds.includes(device.deviceId)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelectDevice(device.deviceId);
                        }}
                      />
                    </td>
                    <td>{device.name}</td>
                    <td>{locationMap.get(device.locationId) || device.locationId}</td>
                    <td>{device.type}</td>
                    <td className="statusBadgeContainer" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleDeviceStatus(device.deviceId, device.status);
                        }}
                        className={`statusBadgeButton ${device.status.toLowerCase()}`}
                        title={`Nhấn để ${device.status === DeviceStatus.ACTIVE ? 'tắt' : 'bật'}`}
                      >
                        {device.status === DeviceStatus.ACTIVE ? "Hoạt động" : "Tạm dừng"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="noResults">Không tìm thấy thiết bị.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && totalRecords > itemsPerPage && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="button secondaryButton paginationButton"
          >
            Trước
          </button>
          <span className="paginationInfo">
            Trang {currentPage} / {Math.ceil(totalRecords / itemsPerPage)} (Tổng: {totalRecords})
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= Math.ceil(totalRecords / itemsPerPage)}
            className="button secondaryButton paginationButton"
          >
            Sau
          </button>
        </div>
      )}

      {showAddForm && (
        <div className="modalOverlay" onClick={handleCloseModals}>
          <div
            className="modalContentWrapper"
            ref={addModalRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modalPopupContainer">
              <PopupModal title="Thêm thiết bị mới" onClose={handleCloseModals}>
                <div className="modalMainContent">
                  <label>
                    Tên thiết bị: <span className="requiredAsterisk">*</span>
                    <input
                      type="text"
                      name="name"
                      value={newDevice.name}
                      onChange={handleNewDeviceChange}
                      required
                    />
                  </label>
                  <label>
                    Loại thiết bị: <span className="requiredAsterisk">*</span>
                    <select name="type" value={newDevice.type} onChange={handleNewDeviceChange}>
                      {deviceTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </label>
                  <label>
                    Khu vực: <span className="requiredAsterisk">*</span>
                    <select
                      name="locationId"
                      value={newDevice.locationId}
                      onChange={handleNewDeviceChange}
                      required
                    >
                      <option value="" disabled>-- Chọn khu vực --</option>
                      {locations.map(loc => <option key={String(loc.locationId)} value={String(loc.locationId)}>{loc.name}</option>)}
                    </select>
                  </label>
                  {newDevice.locationId && newDevice.type && (
                    <div className="configSection">
                      {newDevice.type === DeviceType.MOISTURE_SENSOR && (
                        renderConfigSelect('Cấu hình ngưỡng ẩm', 'thresholdId', newDevice.thresholdId, (name, value) => setNewDevice(prev => ({ ...prev, [name]: value })), '%')
                      )}
                      {newDevice.type === DeviceType.DHT20_SENSOR && (
                        <>
                          {renderConfigSelect('Cấu hình Nhiệt độ Min', 'tempMinId', newDevice.tempMinId, (n, v) => setNewDevice(p => ({ ...p, [n]: v })), '°C')}
                          {renderConfigSelect('Cấu hình Nhiệt độ Max', 'tempMaxId', newDevice.tempMaxId, (n, v) => setNewDevice(p => ({ ...p, [n]: v })), '°C')}
                          {renderConfigSelect('Cấu hình Ngưỡng ẩm KK', 'humidityThresholdId', newDevice.humidityThresholdId, (n, v) => setNewDevice(p => ({ ...p, [n]: v })), '%')}
                        </>
                      )}
                    </div>
                  )}
                  <label>
                    Trạng thái ban đầu:
                    <select name="status" value={newDevice.status} onChange={handleNewDeviceChange}>
                      <option value={DeviceStatus.ACTIVE}>Hoạt động</option>
                      <option value={DeviceStatus.INACTIVE}>Tạm dừng</option>
                    </select>
                  </label>
                </div>
                <div className="modalActions">
                  <button
                    onClick={handleCreateDevice}
                    className="button primaryButton"
                    disabled={modalLoading}
                  >
                    {modalLoading ? "Đang tạo..." : "Tạo mới"}
                  </button>
                  <button
                    onClick={handleCloseModals}
                    className="button secondaryButton"
                    disabled={modalLoading}
                  >
                    Hủy
                  </button>
                </div>
              </PopupModal>
            </div>
          </div>
        </div>
      )}

      {showEditForm && (
        <div className="modalOverlay" onClick={handleCloseModals}>
          <div
            className={`modalContentWrapper ${selectedDeviceInfo &&
                (selectedDeviceInfo.type === DeviceType.PUMP || selectedDeviceInfo.type === DeviceType.FAN || selectedDeviceInfo.type === DeviceType.MOISTURE_SENSOR || selectedDeviceInfo.type === DeviceType.DHT20_SENSOR)
                ? 'modalWithTwoColumns'
                : ''
              }`}
            ref={editModalRef}
            onClick={(e) => e.stopPropagation()}
          >
            {modalLoading && !selectedDeviceInfo ? (
              <div className="modalLoadingIndicator centeredWithinWrapper">
                <p className="loadingText">Đang tải chi tiết thiết bị...</p>
              </div>
            ) : selectedDeviceInfo ? (
              <>
                <div className="modalInfoEditPanel">
                  <div className="modalHeader">
                    <h3>Chi tiết: {selectedDeviceInfo.name}</h3>
                    <button onClick={handleCloseModals} className="modalCloseButton" aria-label="Đóng">×</button>
                  </div>
                  <div className="modalMainContent">
                    <div className="editFieldsSection">
                      <label>
                        Tên thiết bị: <span className="requiredAsterisk">*</span>
                        <input type="text" name="name" value={editDeviceData.name || ""} onChange={handleEditDeviceChange} required />
                      </label>
                      <label>
                        Trạng thái:
                        <select name="status" value={editDeviceData.status || ""} onChange={handleEditDeviceChange}>
                          <option value={DeviceStatus.ACTIVE}>Hoạt động</option>
                          <option value={DeviceStatus.INACTIVE}>Tạm dừng</option>
                        </select>
                      </label>
                      <label>
                        Khu vực: <span className="requiredAsterisk">*</span>
                        <select
                          name="locationId"
                          value={locations.some(loc => String(loc.locationId) === String(editDeviceData.locationId)) ? String(editDeviceData.locationId) : ""}
                          onChange={handleEditDeviceChange}
                          required
                        >
                          <option value="" disabled>-- Chọn khu vực --</option>
                          {locations.map(loc => (
                            <option key={String(loc.locationId)} value={String(loc.locationId)}>
                              {loc.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      {editDeviceData.locationId && (selectedDeviceInfo.type === DeviceType.MOISTURE_SENSOR || selectedDeviceInfo.type === DeviceType.DHT20_SENSOR) && (
                        <div className="configSection">
                          {selectedDeviceInfo.type === DeviceType.MOISTURE_SENSOR && (
                            renderConfigSelect('Cấu hình ngưỡng ẩm', 'thresholdId', editDeviceData.moisture_sensor?.thresholdId, handleEditConfigChange, '%')
                          )}
                          {selectedDeviceInfo.type === DeviceType.DHT20_SENSOR && (
                            <>
                              {renderConfigSelect('Cấu hình Nhiệt độ Min', 'tempMinId', editDeviceData.dht20_sensor?.tempMinId, handleEditConfigChange, '°C')}
                              {renderConfigSelect('Cấu hình Nhiệt độ Max', 'tempMaxId', editDeviceData.dht20_sensor?.tempMaxId, handleEditConfigChange, '°C')}
                              {renderConfigSelect('Cấu hình Ngưỡng ẩm KK', 'humidityThresholdId', editDeviceData.dht20_sensor?.humidityThresholdId, handleEditConfigChange, '%')}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="modalActions">
                    <button
                      onClick={handleEditDevice}
                      className="button primaryButton"
                      disabled={modalLoading}
                    >
                      {modalLoading ? "Đang cập nhật..." : "Cập nhật"}
                    </button>
                    <button
                      onClick={handleCloseModals}
                      className="button secondaryButton"
                      disabled={modalLoading}
                    >
                      Hủy
                    </button>
                  </div>
                </div>

                {(selectedDeviceInfo.type === DeviceType.MOISTURE_SENSOR || selectedDeviceInfo.type === DeviceType.DHT20_SENSOR) && (
                  <div className="modalChartPanel">
                    <div className="panelHeader">Dữ liệu gần đây</div>
                    <div className="chartsArea">
                      {chartLoading ? (
                        <p className="loadingText small">Đang tải biểu đồ...</p>
                      ) : (
                        <>
                          {selectedDeviceInfo.type === DeviceType.MOISTURE_SENSOR && (
                            soilChartData.length > 0 ? (
                              <div className="chartContainer">
                                <ResponsiveContainer width="100%" height={300}>
                                  <LineChart data={soilChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" tickFormatter={(t) => new Date(t).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })} interval="preserveStartEnd" fontSize={11} axisLine={false} tickLine={false} />
                                    <YAxis domain={['dataMin - 5', 'dataMax + 5']} fontSize={11} axisLine={false} tickLine={false} width={40} />
                                    <Tooltip labelFormatter={(t) => new Date(t).toLocaleString("vi-VN")} formatter={(v: number) => [`${v.toFixed(1)}%`, "Độ ẩm đất"]} />
                                    <Legend />
                                    <Line type="monotone" dataKey="soil" stroke="#FF8042" activeDot={{ r: 6 }} dot={false} strokeWidth={2} name="Độ ẩm đất" />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            ) : (
                              <p className="noResults small">Không có dữ liệu độ ẩm đất.</p>
                            )
                          )}
                          {selectedDeviceInfo.type === DeviceType.DHT20_SENSOR && (
                            <div className="dhtChartsWrapper">
                              {temperatureChartData.length > 0 ? (
                                <div className="chartContainer">
                                  <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={temperatureChartData}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="time" tickFormatter={(t) => new Date(t).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })} interval="preserveStartEnd" fontSize={11} axisLine={false} tickLine={false} />
                                      <YAxis domain={['dataMin - 2', 'dataMax + 2']} allowDataOverflow={true} fontSize={11} axisLine={false} tickLine={false} width={40} />
                                      <Tooltip labelFormatter={(t) => new Date(t).toLocaleString("vi-VN")} formatter={(v: number) => [`${v.toFixed(1)}°C`, "Nhiệt độ"]} />
                                      <Legend />
                                      <Line type="monotone" dataKey="temp" stroke="#8884d8" activeDot={{ r: 6 }} dot={false} strokeWidth={2} name="Nhiệt độ" />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              ) : (
                                <p className="noResults small">Không có dữ liệu nhiệt độ.</p>
                              )}
                              {humidityChartData.length > 0 ? (
                                <div className="chartContainer">
                                  <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={humidityChartData}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="time" tickFormatter={(t) => new Date(t).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })} interval="preserveStartEnd" fontSize={11} axisLine={false} tickLine={false} />
                                      <YAxis domain={['dataMin - 5', 'dataMax + 5']} allowDataOverflow={true} fontSize={11} axisLine={false} tickLine={false} width={40} />
                                      <Tooltip labelFormatter={(t) => new Date(t).toLocaleString("vi-VN")} formatter={(v: number) => [`${v.toFixed(1)}%`, "Độ ẩm KK"]} />
                                      <Legend />
                                      <Line type="monotone" dataKey="humidity" stroke="#82ca9d" activeDot={{ r: 6 }} dot={false} strokeWidth={2} name="Độ ẩm KK" />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              ) : (
                                <p className="noResults small">Không có dữ liệu độ ẩm KK.</p>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
                {(selectedDeviceInfo.type === DeviceType.PUMP || selectedDeviceInfo.type === DeviceType.FAN) && (
                  <div className="scheduleManagementPanel">
                    <div className="panelHeader">Quản lý Lịch trình</div>
                    <div className="scheduleListContainer">
                      {scheduleLoading ? (
                        <p className="loadingText small">Đang tải...</p>
                      ) : schedules.length > 0 ? (
                        schedules.map(schedule => (
                          <div key={schedule.scheduleId} className="scheduleItem">
                            <div className="scheduleTime">
                              {new Date(schedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {' - '}
                              {new Date(schedule.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="scheduleDays">
                              Lặp lại: {schedule.repeatDays === 0
                                ? 'Một lần'
                                : getRepeatDaysFromMask(schedule.repeatDays)
                                  .map((d, i) => d ? dayLabels[i] : null)
                                  .filter(Boolean).join(', ') || 'Không'}
                            </div>
                            <div className="scheduleActions">
                              <label className="statusToggle" title={schedule.isActive ? "Bật" : "Tắt"}>
                                <input
                                  type="checkbox"
                                  checked={schedule.isActive}
                                  onChange={() => handleToggleSchedule(schedule.scheduleId, schedule.deviceId)}
                                  disabled={scheduleLoading}
                                />
                                <span className="switch"><span className="slider"></span></span>
                              </label>
                              <button
                                className="deleteScheduleButton"
                                title="Xóa"
                                onClick={() => handleDeleteSchedule(schedule.scheduleId, schedule.deviceId)}
                                disabled={scheduleLoading}
                              >
                                <FaTrashAlt />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="noResults small" style={{ padding: '20px 0' }}>Chưa có lịch trình.</p>
                      )}
                      {!scheduleLoading && scheduleTotal > scheduleItemsPerPage && (
                        <div className="scheduleListPagination">
                          <button
                            onClick={() => handleSchedulePageChange(scheduleCurrentPage - 1)}
                            disabled={scheduleCurrentPage === 1}
                            className="button secondaryButton paginationButton"
                          >
                            Trước
                          </button>
                          <span>
                            {scheduleCurrentPage}/{Math.ceil(scheduleTotal / scheduleItemsPerPage)}
                          </span>
                          <button
                            onClick={() => handleSchedulePageChange(scheduleCurrentPage + 1)}
                            disabled={scheduleCurrentPage >= Math.ceil(scheduleTotal / scheduleItemsPerPage)}
                            className="button secondaryButton paginationButton"
                          >
                            Sau
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="addScheduleContainer">
                      {!showAddScheduleForm ? (
                        <button
                          onClick={() => setShowAddScheduleForm(true)}
                          className="button primaryButton w-full"
                          disabled={scheduleLoading}
                        >
                          Thêm lịch trình mới
                        </button>
                      ) : (
                        <form className="addScheduleForm" onSubmit={(e) => { e.preventDefault(); handleCreateSchedule(); }}>
                          <label>
                            Bắt đầu: <span className="requiredAsterisk">*</span>
                            <input
                              type="datetime-local"
                              name="startTime"
                              value={newSchedule.startTime || ""}
                              onChange={handleNewScheduleChange}
                              required
                            />
                          </label>
                          <label>
                            Kết thúc: <span className="requiredAsterisk">*</span>
                            <input
                              type="datetime-local"
                              name="endTime"
                              value={newSchedule.endTime || ""}
                              onChange={handleNewScheduleChange}
                              required
                            />
                          </label>
                          <label>Lặp lại vào các ngày:</label>
                          <div className="repeatDaysContainer">
                            {dayLabels.map((day, index) => (
                              <label key={index} className="repeatDayLabel">
                                <input
                                  type="checkbox"
                                  name="repeatDay"
                                  value={index}
                                  checked={newScheduleRepeatDays[index]}
                                  onChange={handleNewScheduleChange}
                                />
                                {day}
                              </label>
                            ))}
                          </div>
                          <div className="addScheduleActions">
                            <button
                              type="submit"
                              className="button primaryButton"
                              disabled={scheduleLoading}
                            >
                              {scheduleLoading ? 'Đang lưu...' : 'Lưu'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddScheduleForm(false);
                                setNewSchedule(initialNewScheduleState);
                                setNewScheduleRepeatDays(Array(7).fill(false));
                              }}
                              className="button secondaryButton"
                              disabled={scheduleLoading}
                            >
                              Hủy
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="modalLoadingIndicator centeredWithinWrapper">
                <p className="loadingText">Không thể tải thông tin thiết bị.</p>
                <button onClick={handleCloseModals} className="button secondaryButton">Đóng</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}