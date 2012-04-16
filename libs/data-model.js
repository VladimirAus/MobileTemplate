var ReFuelDB;

initDB();

function initDB()
{
	//current version of data base
	var newVersion = 1.3;
	
	ReFuelDB = window.openDatabase("ReFuelDB", "", "ReFuelDB", 1000000);
	var currentVersion = ReFuelDB.version;
	
	/*
	//run update scripts if required
	if (currentVersion == "1.0") {
		//update from 1.0
		
	} else if (currentVersion == "1.1") {
		//update from 1.1
	}
	*/
	
	if (currentVersion != newVersion){
		
		ReFuelDB.changeVersion(currentVersion, newVersion);
		
		ReFuelDB.transaction(populateDB, 
			function(error) {
				//error
				console.log("Error creating DB: " + error.code);
				}, 
			function() {
				//success
				console.log("DB has been created successfully \nVersion: " + ReFuelDB.version)
			});
	}
	
}


function databaseTransactionError(err) {
	//error
	console.log("Error: " + err.code)
}

//SQLite date is text in format: YYYY-MM-DD HH:MM:SS.SSS
function populateDB(tx) {
	
	//delete existing tables
	tx.executeSql('DROP TABLE IF EXISTS Vehicles');
	
	tx.executeSql('CREATE TABLE IF NOT EXISTS Vehicles (Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, VehicleTitle, VehicleRego)');
	
	tx.executeSql('INSERT INTO Vehicles (Id, VehicleTitle, VehicleRego) VALUES (1, "My BWM", "ABC123")');
	tx.executeSql('INSERT INTO Vehicles (Id, VehicleTitle, VehicleRego) VALUES (2, "Your BMW", "XYZ987")');
}

var Vehicle = function () {
	var self = this;
	
	self.vehicleId = ko.observable();
	self.vehicleTitle = ko.observable();
	self.vehicleNumber = ko.observable();
		
	// Copy data from passed vehicle to the current object
	self.copyVehicle = function (vehicle) {
		this.vehicleId(vehicle.vehicleId());
		this.vehicleTitle(vehicle.vehicleTitle());
		this.vehicleNumber(vehicle.vehicleNumber());
	}
	
	self.reloadVehicle = function () {
		if (self.vehicleId() != undefined) {
			ReFuelDB.transaction(function(tx) {
			tx.executeSql(
				'SELECT * FROM Vehicles WHERE ID=?', 
				[self.vehicleId()], 
				function (tx, results) {
					if (results.rows.length > 0) {
						currentRow = results.rows.item(0);
						
						self.vehicleTitle(currentRow.VehicleTitle);
						self.vehicleNumber(currentRow.VehicleRego);
					}
				}, 
				databaseTransactionError);
			}, 
		databaseTransactionError);
			}
		}
	
	self.saveVehicle = function () {
		var self = this;
		
		if (self.vehicleId() == undefined) {
			
			//insert new item
			ReFuelDB.transaction(function(tx) {
				tx.executeSql(
					'INSERT INTO Vehicles (VehicleTitle, VehicleRego) VALUES (?, ?)',
					[self.vehicleTitle(), self.vehicleNumber()],
					function (tx, results) {
						
						//update newly inserted vehicle id
						self.vehicleId(results.insertId);
						
						}
					); 
				}, databaseTransactionError);
			
		} else {
			//update existing item
			ReFuelDB.transaction(function(tx) {
			tx.executeSql(
				'UPDATE Vehicles SET VehicleTitle = ?, VehicleRego = ? WHERE ID = ?',
				[self.vehicleTitle(), self.vehicleNumber(), self.vehicleId()]
				); 
			}, 
			databaseTransactionError);
		}
		
		return true;
	}
	
	self.deleteVehicle = function () {
		var self = this;
		
		if (self.vehicleId() > -1) {
			
			ReFuelDB.transaction(function(tx) {
				tx.executeSql(
					'DELETE FROM Vehicles WHERE Id = ? ',
					[self.vehicleId()]
					); 
				}, databaseTransactionError);
		} 
		
		return true;
	}
};

var VehicleList = function () {
	
	var self = this;
	
	self.vehicleList = ko.observableArray([]);
	self.isEditMode = ko.observable(false);
	self.isReadMode = ko.computed(function(){
			return !this.isEditMode();
		}, this);
		
	self.loadData = function () {
		
		var self = this;
		self.vehicleList.removeAll();
		
		ReFuelDB.transaction(function(tx) {
			tx.executeSql(
				'SELECT Id, VehicleTitle, VehicleRego FROM Vehicles', 
				[], 
				function (tx, results) {
						
					for(index = 0; index < results.rows.length; index++) {
						
						currentRow = results.rows.item(index);
						
						var newVehicle = new Vehicle();
						newVehicle.vehicleId(currentRow.Id);
						newVehicle.vehicleTitle(currentRow.VehicleTitle);
						newVehicle.vehicleNumber(currentRow.VehicleRego);
						
						self.vehicleList.push(newVehicle);
					}
				}, 
				databaseTransactionError);
			}, 
		databaseTransactionError);
		
		};
		
	self.deleteVehicle = function(vehicle) {
		vehicle.deleteVehicle();
		self.vehicleList.remove(vehicle);
		};

	self.addVehicle = function(vehicle) {
			self.vehicleList.push(vehicle);
		};
	};