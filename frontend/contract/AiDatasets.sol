// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract aiDatasets {
    struct Dataset {
        uint256 datasetId; // 数据集ID
        address owner; // 商家地址
        string title; // 数据集标题
        string description; // 数据集描述
        uint256 price; // 价格
        uint256 fileSize; // 文件大小
        string fileFormat; // 文件格式
        uint256 sales; // 销量
        bool isActive; // 是否可用
        uint256 createAt; // 创建实现
        uint256 updateAt; // 更新时间
    }

    event DatasetCreated(
        uint256 indexed datasetId,
        address indexed owner,
        uint256 price
    );
    event RoleUpdated(address indexed user, Role newRole);
    event DatasetUpdated(
        uint256 indexed datasetId,
        address indexed owner,
        string title,
        string description,
        uint256 price
    );
    event DatasetDeactivated(uint256 indexed datasetId, address indexed owner);
    event DatasetPurchase(
        uint256 indexed datasetId,
        address indexed buyer,
        address indexed seller,
        uint256 price
    );
    event DatasetForceRemoval(uint256 indexed datasetId, address indexed admin);

    uint256 public feeRate = 5; // 默认手续费 5%

    mapping(uint256 => Dataset) public _datasets; // 数据集映射
    uint256[] public datasetIds; // 数据集 ID 数组
    uint256 private _datasetCount = 0; // 数据集数量
    uint256 public isActiveCount = 0; // 已上架数据集数量

    enum Role {
        User,
        Seller,
        Admin
    }
    mapping(address => Role) public roles; // 角色映射
    mapping(uint256 => mapping(address => uint256)) public hasPurchased; // 用户是否购买过数据集

    function role() public view returns (string memory) {
        if (roles[msg.sender] == Role.User) {
            return "User";
        } else if (roles[msg.sender] == Role.Seller) {
            return "Seller";
        } else if (roles[msg.sender] == Role.Admin) {
            return "Admin";
        } else {
            return "undefined";
        }
    }

    modifier onlySeller() {
        require(
            roles[msg.sender] == Role.Seller,
            "Only seller can call this function"
        );
        _;
    }

    modifier onlyAdmin() {
        require(
            roles[msg.sender] == Role.Admin,
            "Only admin can call this function"
        );
        _;
    }

    constructor() {
        roles[msg.sender] = Role.Admin;
    }

    /**
     * @notice 用户升级为卖家
     */
    function upgradeToSeller() public {
        require(roles[msg.sender] == Role.User, "already seller");
        roles[msg.sender] = Role.Seller;
        emit RoleUpdated(msg.sender, Role.Seller);
    }

    /**
     * @notice 设置平台手续费率
     * @param _newFeeRate 新的手续费率（百分比，5表示5%）
     * @dev 仅管理员可调用，修改平台收取的手续费比例
     */
    function setFeeRate(uint256 _newFeeRate) public onlyAdmin {
        require(_newFeeRate <= 50, "fee rate cannot exceed 50%");
        feeRate = _newFeeRate;
    }

    /**
     * @notice 创建数据集
     * @param _title 数据集标题
     * @param _description 数据集描述
     * @param _price 数据集价格（单位：wei）
     * @param _fileSize 文件大小（字节）
     * @param _fileFormat 文件格式
     * @dev 卖家上传数据集信息，数据集上架
     */
    function createDataset(
        uint256 _datasetId,
        string memory _title,
        string memory _description,
        uint256 _price,
        uint256 _fileSize,
        string memory _fileFormat
    ) public onlySeller returns (uint256) {
        require(!_datasets[_datasetId].isActive, "the datasetId is already exits");
        require(_price > 0, "price must be greater than 0");
        require(bytes(_title).length > 0, "title cannot be empty");
        require(_fileSize > 0, "file size must be greater than 0");
        _datasetCount++;
        _datasets[_datasetId] = Dataset({
            datasetId: _datasetId,
            owner: msg.sender,
            title: _title,
            description: _description,
            price: _price,
            fileSize: _fileSize,
            fileFormat: _fileFormat,
            sales: 0,
            isActive: true,
            createAt: block.timestamp,
            updateAt: block.timestamp
        });
        isActiveCount++;
        datasetIds.push(_datasetId);
        emit DatasetCreated(_datasetId, msg.sender, _price);
        return _datasetId;
    }

    /**
     * @notice 更新数据集信息
     * @param _datasetId 数据集ID
     * @param _title 数据集标题
     * @param _description 数据集描述
     * @param _price 数据集价格（单位：wei）
     * @dev 仅卖家可调用
     */
    function updateDataset(
        uint256 _datasetId,
        string memory _title,
        string memory _description,
        uint256 _price
    ) public onlySeller returns (uint256) {
        require(bytes(_title).length > 0, "title cannot be empty");
        require(_price > 0, "price must be greater than 0");
        require(
            _datasetId > 0 && _datasetId <= _datasetCount,
            "dataset does not exist"
        );
        require(
            _datasets[_datasetId].owner != address(0),
            "dataset has been removed"
        );
        require(_datasets[_datasetId].owner == msg.sender, "not dataset owner");
        _datasets[_datasetId].title = _title;
        _datasets[_datasetId].description = _description;
        _datasets[_datasetId].price = _price;
        _datasets[_datasetId].updateAt = block.timestamp;

        emit DatasetUpdated(
            _datasetId,
            msg.sender,
            _title,
            _description,
            _price
        );
        return _datasetId;
    }

    /**
     * @notice 下架数据集
     * @param _datasetId 数据集ID
     * @dev 仅数据集拥有者可调用
     */
    function deactivateDataset(uint256 _datasetId) public onlySeller {
        require(
            _datasetId > 0 && _datasetId <= _datasetCount,
            "Dataset does not exist"
        );
        require(
            _datasets[_datasetId].owner != address(0),
            "Dataset has been removed"
        );
        require(
            _datasets[_datasetId].owner == msg.sender,
            "you only can update youself datasets"
        );
        require(
            _datasets[_datasetId].isActive != false,
            "this dataset already is no active"
        );
        _datasets[_datasetId].isActive = false;
        isActiveCount--;
        emit DatasetDeactivated(_datasetId, msg.sender);
    }

    /**
     * @notice 管理员强制删除数据集
     * @param _datasetId 数据集ID
     * @dev 仅管理员可调用
     */
    function forcedRemovalDataset(uint256 _datasetId) public onlyAdmin {
        require(
            _datasets[_datasetId].isActive,
            "this dataset already is no active"
        );
        _datasets[_datasetId] = Dataset({
            datasetId: _datasetId,
            owner: address(0),
            title: "",
            description: "",
            price: 0,
            fileSize: 0,
            fileFormat: "",
            sales: 0,
            isActive: false,
            createAt: block.timestamp,
            updateAt: block.timestamp
        });
        isActiveCount--;
        emit DatasetForceRemoval(_datasetId, msg.sender);
    }

    /**
     * @notice 购买数据集
     * @param _datasetId 数据集ID
     * @dev 用户支付后获得数据集访问权限
     */
    function purchaseDataset(uint256 _datasetId) public payable {
        require(
            _datasetId > 0 && _datasetId <= _datasetCount,
            "Dataset does not exist"
        );
        require(
            _datasets[_datasetId].owner != address(0),
            "Dataset has been removed"
        );
        require(
            _datasets[_datasetId].owner != msg.sender,
            "cannot purchase your own dataset"
        );
        require(
            hasPurchased[_datasetId][msg.sender] == 0,
            "you already buy it"
        );
        uint256 _price = _datasets[_datasetId].price;
        require(msg.value >= _price, "your money is less then price");
        require(_datasets[_datasetId].isActive, "dataset is not active");
        uint256 feeRatePrice = (_price * feeRate) / 100; // 平台抽成
        uint256 price = _price - feeRatePrice; // 卖家实际所得
        hasPurchased[_datasetId][msg.sender] = block.timestamp;
        _datasets[_datasetId].sales += 1;
        payable(_datasets[_datasetId].owner).transfer(price);
        emit DatasetPurchase(
            _datasetId,
            msg.sender,
            _datasets[_datasetId].owner,
            _price
        );
    }

    /**
     * @notice 判断用户是否购买过该数据集
     * @param _user 用户地址
     * @dev 用户购买过可以下载
     */
    function isBuyDataset(address _user, uint256 _datasetId)
        public
        view
        returns (bool)
    {
        return hasPurchased[_datasetId][_user] != 0;
    }

    /**
     * @notice 管理员提取合约余额
     * @dev 仅管理员可调用
     */
    function withdrawal() public payable onlyAdmin {
        payable(msg.sender).transfer(address(this).balance);
    }

    /**
     * @notice 获取所有数据集
     * @dev 显示所有的数据集
     */
    function getListDatasets() public view returns (uint256[] memory) {
        uint256[] memory isActivedatasetIds = new uint256[](isActiveCount);
        uint256 index = 0;
        for (uint256 i = 0; i < _datasetCount; i++) {
            if (_datasets[datasetIds[i]].isActive) {
                isActivedatasetIds[index++] = datasetIds[i];
            }
        }
        return isActivedatasetIds;
    }
}
