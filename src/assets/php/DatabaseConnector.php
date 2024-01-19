<?php

/**
 * DatabaseConnector.php
 * 
 * Base file for usage of DatabaseConnector 
 * DatabaseConnector allows connections to several installed database drivers
 * such as MySql, Postgresql, SQLite etc. (depends on what is installed and
 * activated on the server)
 * 
 * @author Michael Pohl (www.simatex.de)
 */


// Avoid multiple declarations of DatabaseConnector in the same project.
if (class_exists('DatabaseConnector')) 
{
    return;
}




/*******************************************************************************
 * DatabaseConnector
 * 
 * Main class of the database wrapper for MySql, Postgresql, SQLite and others.
 * Important! The drivers have to be installed/activated on the server
 */
class DatabaseConnector
{
	// PDO database object for all connections to establish
	private $_DatabaseObject = NULL; 
	// Parameter to control the output of SQL statements for debugging
	private $_PrintSql = false;
	// Table prefix to use for SQL statements optionally
	private $_TablePrefix = '';
	// Default placeholder to replace with $_TablePrefix
	private $_PrefixPlaceholder = '#_';
	// Contains the error message of the last occured error
	private $_LastErrorMessage = '';
	// Temporary storage for partial SQL results
	private $_PDOStatement = NULL;
	// Temproary storage for prepared statements
	private $_PDOStatementPrepared = NULL;
	// Temporary storage for time messurement of GetExecutionTime()
	private $_ExecutionStart = 0;
	// Result of the runtime calculation of GetExecutionTime()
	private $_ExecutionTime = 0;
	// Necessary to allow nested transactions
	protected $_TransactionLevel = 0;
	// Setting the connection types, that support nested transactions
	// (SAVEPOINTS are supported)
	// Important! MySQL doesn't support nested transaction when MyISAM-tables
	// are used.
	protected $_NestedTransactionDrivers = 
		array('pgsql', 'mysql', 'sqlite');
	
	


	/*************************************************************************
	 * __construct ()
	 *
	 * Constructor with basic settings
	 *
	 * @param bool $PrintSql      Sets the output of SQL statements. If true, every
	 *                            executed SQL statment is printed. 
	 *                            To allow formatting of this statments, every one
	 *                            is printed within <div class='PrintSql'></div>
	 * @param string $TablePrefix Table prefix to use for every SQL statement.
	 *                            If a single database uses tables of multiple 
	 *                            applications (eg. "webapp1_counter", 
	 *                            "webapp2_users" etc.), the prefix to use can
	 *                            be set here.
	 *                            If the prefix "webapp2" is set, SQL statements
	 *                            can be entered like:
	 *                            "SELECT * FROM #_users" which is automatically
	 *                            replaced with:
	 *                            "SELECT * FROM webapp2_users" prior to execution.
	 */
	public function __construct ($PrintSql = FALSE, $TablePrefix = '')
	{
		$this->_PrintSql    = $PrintSql;
		$this->_TablePrefix = $TablePrefix;
	}


	/*************************************************************************
	 * splitHostPort ()
	 *
	 * Splits a given Hostname incl. Port in two different elements of the 
	 * return array.
	 *
	 * @param string $HostPort Hostename incl. port (eg. "localhost:3030")
	 *
	 * @return array Associative array with the two fields ['host'] and ['port']
	 */
	private function splitHostPort ($HostPort)
	{
		$strPort = '';

		// If a complete URL is given (eg. like "https://...", some characters
		// are temporariliy replaced to be able to use the explode() function
		// with ':'.
		$HostPort = str_replace('://', '%DBTMP%', $HostPort);

		$arrExplode = explode (':', $HostPort, 2);

		$iCount = count($arrExplode);
		if ($iCount == 2)
		{
			$strHost = $arrExplode[0];
			$strPort = $arrExplode[1];
		}
		else if ($iCount == 1)
		{
			$strHost = $arrExplode[0];
		}

		$strHost = str_replace('%DBTMP%', '://', $strHost);
		return array ('host' => $strHost, 'port' => $strPort);
	}


	/*************************************************************************
	 * isNestableTransaction ()
	 *
	 * Checks if the currently used database driver supports nested
	 * transactions.
	 *
	 * @return bool TRUE, if nested transactions are supported currently,
	 *              otherwise FALSE
	 */
	private function isNestableTransaction ()
	{
		return in_array($this->GetDBType(), $this->_NestedTransactionDrivers);
	}


	/*************************************************************************
	 * replacePrefix ()
	 * 
	 * Replaces the prefix placeholder with the set prefix.
	 *
	 * @param string $SqlQuery SQL query with optional set placeholder.
	 *                         (Default: '#_')
	 * @param string $Prefix   Optional prefix placeholder that's used in the query.
	 *                         If no value is given, the $_PrefixPlaceholder is
	 *                         used.
	 *
	 * @return string SQL statement with replaced table prefixes.
	 */
	private function replacePrefix ($SqlQuery, $Prefix = '')
	{
		return str_replace(
				(empty($Prefix) ? $this->_PrefixPlaceholder : $Prefix), 
				$this->_TablePrefix, $SqlQuery);
	}


	/*************************************************************************
	 * startExecutionTimer ()
	 * 
	 * Starts the time measurement to calculate the execution time of queries
	 */
	private function startExecutionTimer ()
	{
		$this->_ExecutionTime  = 0;
		$this->_ExecutionStart = microtime(true);
	}


	/*************************************************************************
	 * stopExecutionTimer ()
	 * 
	 * Stops the time measurement to calculate the execution time of queries.
	 **/
	private function stopExecutionTimer ()
	{
		$this->_ExecutionTime = microtime(true) - $this->_ExecutionStart;
	}


	/*************************************************************************
	 * sqlGetPDOObject ()
	 * 
	 * Executes a given SQL query and returns the result as processable
	 * PDOObject.
	 *  
	 * @param string $SqlQuery    SQL statement with optional placeholder to execute
	 * @param int    $FetchMethod Optional PDO query mode for the current statement.
	 *                            (default: PDO::FETCH_BOTH; otherwise any constant
	 *                            of the collection PDO::FETCH_xxx)
	 * 
	 * @return PDOStatement Result of the executed query as processable PDOObject
	 *                      or FALSE, if an error occurs.
	 */
	private function sqlGetPDOObject ($SqlQuery, $FetchMethod = PDO::FETCH_BOTH)
	{
		$this->_LastErrorMessage = '';
		$resultReturn = FALSE;
		$this->startExecutionTimer();

		if (!$this->IsConnected())
		{
			$this->_LastErrorMessage = 'no database connected';
			return FALSE;
		}

		try
		{
			if ($this->_PrintSql === TRUE)
			{
				echo "<div class='PrintSql'>$SqlQuery</div>";
			}

			if (($resultReturn = 
				$this->_DatabaseObject->query(
					$this->replacePrefix($SqlQuery), $FetchMethod)) === FALSE)
			{
				$arrTemp = $this->_DatabaseObject->errorInfo();
				$this->_LastErrorMessage = $arrTemp[2];

				return FALSE;
			}

			$this->stopExecutionTimer();
			return $resultReturn;
		}
		catch (PDOException $e)
		{
			$this->_LastErrorMessage = $e->getMessage();
			return FALSE;
		}
	}


	# Connecting/disconnecting a database >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

	/**********************************************************************
	 * Connect ()
	 *
	 * Connects a database with the PDO default parameters. This method should
	 * only be used with extended knowledge of PDO.
	 * It's recommended to use the helper methods ConnectXYZ().
	 *
	 * @param string $Dsn      String with the PDO-DSN (data source name), which
	 *                         contains information about the database to connect.
	 * @param string $User     Optional username of the PDO-DSN.
	 * @param string $Password Optional string with the password of the PDO-DSN
	 * @param array  $DriverOptions A key-value array with driver specific
	 *                              connection options
	 *
	 * @return bool TRUE, if the connection could be established, otherwise FALSE
	 */
	public function Connect ($Dsn, $User = NULL, $Password = NULL, 
			$DriverOptions = NULL)
	{
		$this->_LastErrorMessage = '';

		try 
		{
			// All parameters are given...
			if ($DriverOptions !== NULL)
			{
				$this->_DatabaseObject = new PDO ($Dsn, $User, $Password, 
					$DriverOptions);
			}
			// Only username and password are given...
			else if ($Password !== NULL)
			{
				$this->_DatabaseObject = new PDO ($Dsn, $User, $Password);
			}
			// Only username is given...
			else if ($User !== NULL)
			{
				$this->_DatabaseObject = new PDO ($Dsn, $User);
			}
			// Only DSN is given...
			else
			{
				$this->_DatabaseObject = new PDO ($Dsn);
			}
		}
		catch (PDOException $e)
		{
			$this->_LastErrorMessage = $e->getMessage();
			return FALSE;
		}

		return TRUE;
	}


	/**********************************************************************
	 * ConnectSqlite3 ()
	 *
	 * Helper function to establish a connection to a SQLite3 database.
	 * The necessary PDO driver has to be installed/activated on the server.
	 *
	 * @param string $Filename Filename (with path) of the database file to open
	 * @param int    $Timeout  Specifies the timeout duration in seconds (optional). 
	 *
	 * @return bool TRUE, if the connection could be established, otherwiese FALSE.
	 */
	public function ConnectSqlite3 ($Filename, $Timeout = -1)
	{
		if (!file_exists($Filename))
		{
			$this->_LastErrorMessage = 'Database file not found';
			return FALSE;
		}
		
		if (file_exists($Filename) && !is_writable($Filename))
		{
			$this->_LastErrorMessage = 'Database not writable';
			return FALSE;
		}
		
		$bResult = $this->Connect("sqlite:$Filename");

		if ($bResult === TRUE && $Timeout > -1)
		{
			$this->_DatabaseObject->setAttribute(PDO::ATTR_TIMEOUT, $Timeout);
		}

		return $bResult;
	}


	/**********************************************************************
	 * ConnectSqlite2 ()
	 *
	 * Helper function to establish a connection to a SQLite2 database.
	 * The necessary PDO driver has to be installed/activated on the server.
	 *
	 * @param string $Filename Filename (with path) of the database file to open
	 * @param int    $Timeout  Specifies the timeout duration in seconds (optional). 
	 *
	 * @return bool TRUE, if the connection could be established, otherwiese FALSE.
	 */
	public function ConnectSqlite2 ($Filename, $Timeout = -1)
	{
		if (!file_exists($Filename))
		{
			$this->_LastErrorMessage = 'Database file not found';
			return FALSE;
		}
		
		if (file_exists($Filename) && !is_writable($Filename))
		{
			$this->_LastErrorMessage = 'Database not writable';
			return FALSE;
		}
		
		$bResult = $this->Connect("sqlite2:$Filename");

		if ($bResult === TRUE && $Timeout > -1)
		{
			$this->_DatabaseObject->setAttribute(PDO::ATTR_TIMEOUT, $Timeout);
		}

		return $bResult;
	}


	/**********************************************************************
	 * ConnectMysql ()
	 *
	 * Helper function to establish a connection to a MySql database.
	 * The necessary PDO driver has to be installed/activated on the server.
	 *
	 * @param string $Host     Hostname to connect to. If a special port should be
	 *                         used, it can be entered like "localhost:3030"
	 * @param string $User     Username for the database connection
	 * @param string $Password Password to use for the database connection
	 * $param string $Database Name of the database to connect to
	 * @param int    $Timeout  Specifies the timeout duration in seconds (optional).
	 *
	 * @return bool TRUE, if the connection could be established, otherwiese FALSE
	 */
	public function ConnectMysql ($Host, $User, $Password, $Database, 
		$Timeout = -1)
	{
		$arrOptions = NULL;

		// Is there a port given with the host parameter?
		$arrHostPort = $this->splitHostPort($Host);
		$strHost     = $arrHostPort['host'];
		$strPort     = $arrHostPort['port'];

		$strDsn = "mysql:host=$strHost;dbname=$Database";

		if ($strPort != '')
		{
			$strDsn .= ";port=$strPort";
		}

		// Depending on the PHP version, the UTF8 charset is set differently.
		// PHP-Version < 5.3.6
		if (version_compare(PHP_VERSION, '5.3.6') < 0)
		{
			$arrOptions = array (
				PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8');
		}
		// PHP-Version >= 5.3.6
		else
		{
			$strDsn .= ";charset=utf8";
		}

		$bResult =  $this->Connect($strDsn, $User, $Password, $arrOptions);

		if ($bResult === TRUE && $Timeout > -1)
		{
			$this->_DatabaseObject->setAttribute(PDO::ATTR_TIMEOUT, $Timeout);
		}

		return $bResult;
	}


	/**********************************************************************
	 * ConnectPostgresql ()
	 *
	 * Helper function to establish a connection to a Postgresql database.
	 * The necessary PDO driver has to be installed/activated on the server.
	 *
	 * @param string $Host     Hostename/IP address to connect to. If a special port 
	 *                         should be used, it can be entered like "localhost:3030"
	 * @param string $User     Username to use for the database connection
	 * @param string $Password Password to use for the database connection
	 * $param string $Database Name of the database to connect to
	 * @param int    $Timeout  Specifies the timeout duration in seconds (optional).
	 *
	 * @return bool TRUE, if the connection could be established, otherwiese FALSE
	 */
	public function ConnectPostgresql ($Host, $User, $Password, $Database,
		$Timeout = -1)
	{
		$arrOptions = NULL;

		// Wurde im Host-Parameter ein Port mitgegeben?
		$arrHostPort = $this->splitHostPort($Host);
		$strHost     = $arrHostPort['host'];
		$strPort     = $arrHostPort['port'];

		$strDsn = "pgsql:host=$strHost;dbname=$Database";

		if ($strPort != '')
		{
			$strDsn .= ";port=$strPort";
		}

		$bResult =  $this->Connect($strDsn, $User, $Password, $arrOptions);

		if ($bResult === TRUE && $Timeout > -1)
		{
			$this->_DatabaseObject->setAttribute(PDO::ATTR_TIMEOUT, $Timeout);
		}

		return $bResult;
	}


	/**********************************************************************
	 * Disconnect ()
	 * 
	 * Closes the current database connection, if there exists one.
	 */
	public function Disconnect ()
	{
		$this->_DatabaseObject = NULL;
	}

	
	# Connection information >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

	/**********************************************************************
	 * GetDBType ()
	 *
	 * Returns the name of the currently used database driver (eg. "mysql") if
	 * a connection exists.
	 *
	 * @return string Name of the currently used database driver or FALSE if
	 *                an error occured
	 */
	public function GetDBType ()
	{
		$this->_LastErrorMessage = '';

		if (!$this->IsConnected())
		{
			$this->_LastErrorMessage = 'no database connected';
			return FALSE;
		}

		try
		{
			$dbType =  
				$this->_DatabaseObject->getAttribute(PDO::ATTR_DRIVER_NAME);
		}
		catch (PDOException $e)
		{
			$this->_LastErrorMessage = $e->getMessage();
			return FALSE;
		}

		if ($dbType === NULL)
		{
			$this->_LastErrorMessage = 
				'pdo attribute PDO::ATTR_DRIVER_NAME not available';
			return FALSE;
		}

		return $dbType;
	}


	/**********************************************************************
	 * GetLastError ()
	 * 
	 * Returns the last occured error message.
	 *
	 * @return string Last occured error message
	 */
	public function GetLastError ()
	{
		return $this->_LastErrorMessage;
	}


	/**********************************************************************
	 * IsConnected ()
	 *
	 * Returns information about the database connection was established.
	 *
	 * @return bool TRUE, if a database connection exsits, otherwiese FALSE
	 */
	public function IsConnected ()
	{
		return ($this->_DatabaseObject !== NULL);
	}


	/**********************************************************************
	 * GetAvailableDrivers ()
	 * 
	 * Returns information about what PDO drivers are supported by the server.
	 * 
	 * @return array Supported driver names or FALSE, if no driver name could
	 *               be determined.
	 */
	public function GetAvailableDrivers ()
	{
		try
		{
			$arrDrivers = pdo_drivers();
		}
		catch (PDOException $e)
		{
			$this->_LastErrorMessage = $e->getMessage();
			return FALSE;
		}

		if (count($arrDrivers) == 0)
		{
			$this->_LastErrorMessage = 'no drivers found';
			return FALSE;
		}

		return $arrDrivers;
	}

	
	# Transaction control >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

	/**********************************************************************
	 * TransactionStart ()
	 *
	 * Starts a transaction, when the database connection is established.
	 * If the currently used database driver supports nested transactions,
	 * such transactions can be started.
	 *
	 * @return bool TRUE, if the transaction could be started successfully or
	 *              FALSE, if an error occured or the database is not connected.
	 */
	public function TransactionStart ()
	{
		$this->_LastErrorMessage = '';

		if (!$this->IsConnected())
		{
			$this->_LastErrorMessage = 'no database connected';
			return FALSE;
		}

		try
		{
			// If the database driver doesn't support nested transactions or
			// it's the first transaction to start...
			if (!$this->isNestableTransaction() || $this->_TransactionLevel === 0)
			{
				// A transaction is already active and the currently used driver
				// doesn't support nested transactions.
				if ($this->_TransactionLevel > 0)
				{
					$this->_LastErrorMessage = 'transaction already active';
					return FALSE;
				}

				if ($this->_DatabaseObject->beginTransaction() === FALSE)
				{
					$arrTemp = $this->_DatabaseObject->errorInfo();
					$this->_LastErrorMessage = $arrTemp[2];
					return FALSE;
				}
			}
			// If it's a nested transaction which is supported by the currently
			// used database driver.
			else 
			{
				$this->ExecuteSql('SAVEPOINT LEVEL{$this->_TransactionLevel}');
			}

			$this->_TransactionLevel++;

		}
		catch (PDOException $e)
		{
			$this->_LastErrorMessage = $e->getMessage();
			return FALSE;
		}

		return TRUE;
	}


	/**********************************************************************
	 * GetTransactionLevel ()
	 * 
	 * Returns the level of the running transaction.
	 * 
	 * @return int 0 if no transaction is running or >0 if at least one ore
	 *             more nested transactions are running.
	 */
	public function GetTransactionLevel ()
	{
		return $this->_TransactionLevel;
	}


	/**********************************************************************
	 * TransactionRollback ()
	 * 
	 * Executes a rollback on the currently running/last transaction, if the
	 * database connection was established and at least one transaction was
	 * started.
	 * 
	 * If the currently used database driver supports nested transactions and
	 * one of them was used, the last started transaction can be rolled back.
	 *
	 * @return bool TRUE, if the rollback was sucessfull, or FALSE, if an
	 *              error occured whild rolling back, no transaction is
	 *              running or no database connection was established.
	 **/
	public function TransactionRollback ()
	{
		$this->_LastErrorMessage = '';

		if (!$this->IsConnected())
		{
			$this->_LastErrorMessage = 'no database connected';
			return FALSE;
		}

		if ($this->_TransactionLevel == 0)
		{
			$this->_LastErrorMessage = 'no active transaction';
			return FALSE;
		}

		try
		{
			// The currently used database driver doesn't support nested
			// transactions or it's the first started transaction.
			if (!$this->isNestableTransaction() || $this->_TransactionLevel == 1)
			{
				if ($this->_DatabaseObject->rollBack() === FALSE)
				{
					$arrTemp = $this->_DatabaseObject->errorInfo();
					$this->_LastErrorMessage = $arrTemp[2];
					return FALSE;
				}
			}
			else
			{
				$this->ExecuteSql('ROLLBACK TO SAVEPOINT LEVEL{$this->(_TransactionLevel-1)}');
			}

			$this->_TransactionLevel--;
		}
		catch (PDOException $e)
		{
			$this->_LastErrorMessage = $e->getMessage();
			return FALSE;
		}

		return TRUE;
	}


	/**********************************************************************
	 * TransactionCommit ()
	 *
	 * Executes a commit on the running/last transaction, if a database
	 * connection was established and at least one transaction was started.
	 * If the currently used database driver supports nested transactions and
	 * one of them are used, the last started transaction can be committed.
	 *
	 * @return bool TRUE, if the commit was sucessfull or FALSE, if an error
	 *              occured, no transaction is running or no database
	 *              connection was established.
	 */
	public function TransactionCommit ()
	{
		$this->_LastErrorMessage = '';

		if (!$this->IsConnected())
		{
			$this->_LastErrorMessage = 'no database connected';
			return FALSE;
		}

		if ($this->_TransactionLevel == 0)
		{
			$this->_LastErrorMessage = 'no active transaction';
			return FALSE;
		}

		try
		{
			// The currently used database driver doesn't support nested
			// transactions or it's the first started transaction.
			if (!$this->isNestableTransaction() || $this->_TransactionLevel == 1)
			{
				if ($this->_DatabaseObject->commit() === FALSE)
				{
					$arrTemp = $this->_DatabaseObject->errorInfo();
					$this->_LastErrorMessage = $arrTemp[2];
					return FALSE;
				}
			}
			else
			{
				$this->ExecuteSql('RELEASE SAVEPOINT LEVEL{$this->(_TransactionLevel-1)}');
			}

			$this->_TransactionLevel--;
		}
		catch (PDOException $e)
		{
			$this->_LastErrorMessage = $e->getMessage();
			return FALSE;
		}

		return TRUE;
	}


	# SQL query execution >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

	/**********************************************************************
	 * SqlPrepareStatement ()
	 * 
	 * Prepares an SQL statement with placeholders ('?') to allow a later
	 * execution or one with different parameters.
	 * (e.g. "SELECT * FROM #_table WHERE id > ?;")
	 * 
	 * @param string $SqlQuery    SQL statement to prepare for a later execution
	 * @param int    $FetchMethod Optional PDO query mode for the current statement.
	 *                            (default: PDO::FETCH_BOTH; otherwise any constant
	 *                            of the collection PDO::FETCH_xxx)
	 * 
	 * @return bool TRUE, if the statement could properly prepared, otherwise
	 *              FALSE
	 */
	public function SqlPrepareStatement ($SqlQuery, $FetchMethod = PDO::FETCH_BOTH)
	{
		$this->_LastErrorMessage = '';

		try
		{
			if ($this->IsConnected())
			{
				$Result = ($this->_PDOStatementPrepared =
					$this->_DatabaseObject->prepare(
						$this->replacePrefix($SqlQuery)
					)) !== FALSE;

				if ($Result === FALSE)
				{
					$this->_PDOStatementPrepared = NULL;
				}
				else
				{
					// Sets the given FETCH_MODE for all SQL statements basing
					// on this query object
					$this->_PDOStatementPrepared->setFetchMode($FetchMethod);
				}

				return $Result;
			}
			else
			{
				$this->_LastErrorMessage = 'no database connected';
			}                
		} 
		catch (PDOException $e) 
		{
			$this->_LastErrorMessage = $e->getMessage();
		}

		return FALSE;
	}

	
	/*************************************************************************
	 * SqlBindPreparedParam()
	 * 
	 * Binds a variable via reference to a placeholer of a prepared SQL statement
	 * (e.g. ":name" or index).
	 * The content of the variable is only used, when data is queried.
	 * 
	 * @param string $Parameter Name of the placeholder that was used in the
	 *                          prepared statement via SqlPrepareStatement().
	 *                          This could be either a name (e.g. ":name") or
	 *                          a 1-based (!) index, if placeholder "?" was used.
	 * @param mixed $Variable   Variable, that should be bound with the used
	 *                          placeholder (byRef)
	 * @param int   $DataType   Optional datatype of the parameter as integer
	 *                          of the PDO::PARAM_xxx collection.
	 *                          (Default: PDO::PARAM_STR).
	 *                          Controls, who the bould variable is handled
	 *                          within the query.
	 * 
	 * @return bool TRUE, if the variable could be bould sucessfully, otherwise
	 *              FALSE
	 **/
	public function SqlBindPreparedParam ($Parameter, &$Variable, 
		$DataType = PDO::PARAM_STR)
	{
		$bResult = FALSE;

		try
		{
			$bResult = $this->_PDOStatementPrepared->bindParam(
				$Parameter, $Variable, $DataType);
		}
		catch (PDOException $e) 
		{
			$this->_LastErrorMessage = $e->getMessage();
		}

		return $bResult;
	}
	
	
	/*************************************************************************
	 * SqlBindPreparedValue()
	 * 
	 * Binds a variable via value to a placeholer of a prepared SQL statement
	 * (e.g. ":name" or index).
	 * The content of the variable is only used, when data is queried.
	 * 
	 * @param string $Parameter Name of the placeholder that was used in the
	 *                          prepared statement via SqlPrepareStatement().
	 *                          This could be either a name (e.g. ":name") or
	 *                          a 1-based (!) index, if placeholder "?" was used.
	 * @param mixed $Value      Variable with value, that should be bound to the 
	 *                          used placeholder (byValue)
	 * @param int   $DataType   Optional datatype of the parameter as integer
	 *                          of the PDO::PARAM_xxx collection.
	 *                          (Default: PDO::PARAM_STR).
	 *                          Controls, who the bould variable is handled
	 *                          within the query.
	 * 
	 * @return bool TRUE, if the value of the variable could be bould 
	 *              sucessfully, otherwise FALSE
	 **/
	public function SqlBindPreparedValue ($Parameter, $Value, 
		$DataType = PDO::PARAM_STR)
	{
		$bResult = FALSE;

		try
		{
			$bResult = $this->_PDOStatementPrepared->bindValue(
				$Parameter, $Value, $DataType);
		}
		catch (PDOException $e) 
		{
			$this->_LastErrorMessage = $e->getMessage();
		}

		return $bResult;
	}
	

	/**********************************************************************
	 * SqlExecute ()
	 * 
	 * Executes the given SQL query on the connected database without 
	 * expecting a return value (e.g. "UPDATE #__counter SET count = count +1;").
	 * If $PrintSql was set to TRUE in the constructor, the query to execute
	 * is printed to screen (with CSS clas 'PrintSql').
	 * 
	 * @param string $SqlQuery SQL query with optional table prefix placeholder.
	 * 
	 * @return int Number of changed database rows or FALSE if an error occured.
	 */
	public function SqlExecute ($SqlQuery)
	{
		$this->_LastErrorMessage = '';
		$iAffectedRows = FALSE;
		$this->startExecutionTimer();

		try 
		{
			if ($this->IsConnected())
			{
				if ($this->_PrintSql === TRUE)
				{
					echo "<div class='PrintSql'>$SqlQuery</div>";
				}

				if (($iAffectedRows = $this->_DatabaseObject->exec(
					$this->replacePrefix($SqlQuery))) === FALSE)
				{
					$arrTemp = $this->_DatabaseObject->errorInfo();
					$this->_LastErrorMessage = $arrTemp[2];
				}
			}
			else
			{
				$this->_LastErrorMessage = 'No database connected';
			}
		}
		catch (PDOException $e)
		{
			$this->_LastErrorMessage = $e->getMessage();
			return FALSE;
		}

		$this->stopExecutionTimer();
		return $iAffectedRows;
	}
	
	
	/**********************************************************************
	 * SqlExecutePrepared ()
	 * 
	 * Executes the prepared SQL statement with SqlPrepareStatement() on the 
	 * connected database without expecting a return value 
	 * (e.g. "UPDATE #__counter SET count = count +1;").
	 * 
	 * @param array $ParameterArray (optional) One dimensional array with values
	 *                              to replace the '?' placeholders or key-value
	 *                              pairs to replace the ':name' placeholders
	 * 
	 * @return bool TRUE if the query was successful or FALSE on failure.
	 */
	public function SqlExecutePrepared ( $ParameterArray = NULL )
	{
		$this->_LastErrorMessage = '';
		$returnValue = FALSE;
		$this->startExecutionTimer();

		try 
		{
			if ($this->_PDOStatementPrepared != NULL)
			{
				if ($this->_PDOStatementPrepared->execute($ParameterArray))
				{
					$returnValue = TRUE;
				}
			}
			else
			{
				$this->_LastErrorMessage = 'No statement prepared';
			}
		}
		catch (PDOException $e)
		{
			$this->_LastErrorMessage = $e->getMessage();
		}

		$this->stopExecutionTimer();
		return $returnValue;
	}


	/**********************************************************************
	 * SqlGetLastInsertId ()
	 * 
	 * Returns the ID, that was created with the last inserted dataset.
	 * Important! The currently used driver has to support this functionality.
	 * 
	 * @param string $Column Name of the column that contains the id (optional).
	 *                      Default is ''. This value is only needed for some
	 *                      older database drivers       
	 * 
	 * @return string Row id of the last row that was inserted into the database
	 *                or FALSE, if an error occured
	 */
	public function SqlGetLastInsertId ($Column = '')
	{
		$this->_LastErrorMessage = '';

		if (!$this->IsConnected())
		{
			$this->_LastErrorMessage = 'no database connected';
			return FALSE;
		}

		try
		{
			return $Column != '' ?
				$this->_DatabaseObject->lastInsertId($Column) :
				$this->_DatabaseObject->lastInsertId();
		}
		catch (PDOException $e)
		{
			$this->_LastErrorMessage = $e->getMessage();
			return FALSE;
		}
	}


	/**********************************************************************
	 * SqlGetLines ()
	 * 
	 * Executes a given SQL statement on the connected database and returns
	 * the result as array that can by default be accessed via index
	 * ($result[0][2]) or name ($result[0]['name']).
	 * 
	 * @param string $SqlQuery    SQL query with optional table prefix placeholder
	 *                            to execute
	 * @param int    $FetchMethod Optional PDO query mode for the current statement.
	 *                            (default: PDO::FETCH_BOTH; otherwise any constant
	 *                            of the collection PDO::FETCH_xxx)
	 * 
	 * @return array Result of the executed query, NULL if no result could be
	 *               found or FALSE, if an error occured.
	 */
	public function SqlGetLines ($SqlQuery, $FetchMethod = PDO::FETCH_BOTH)
	{
		$resultReturn = $this->sqlGetPDOObject($SqlQuery, $FetchMethod);

		if ($resultReturn !== FALSE)
		{
			// Conversion of a PDOStatement to an array to return
			$arrRet = array();

			foreach ($resultReturn as $Entry)
			{
				$arrRet[] = $Entry;
			}

			return count($arrRet) == 0 ? NULL : $arrRet;
		}

		return FALSE;
	}


	/**********************************************************************
	 * SqlGetLinesAsObject ()
	 * 
	 * Executes a given SQL statement on the connected database and returns
	 * the result as array of objects, where the columns can be accessed as
	 * object attributes ($result[0]->name or $result[0]->city).
	 * Important! It's always a little tricky and risky to work with this kind
	 *            of object attributes, so this method should be used with care. 
	 * 
	 * @param string $SqlQuery    SQL query with optional table prefix placeholder
	 *                            to execute
	 * @param int    $FetchMethod Optional PDO query mode for the current statement.
	 *                            (default: PDO::FETCH_BOTH; otherwise any constant
	 *                            of the collection PDO::FETCH_xxx)
	 * 
	 * @return array Result of the SQL query as an array of objects or FALSE,
	 *               if an error occured.
	 */
	public function SqlGetLinesAsObject ($SqlQuery, $FetchMethod = PDO::FETCH_BOTH)
	{
		$arrResult = $this->SqlGetLines($SqlQuery, $FetchMethod);

		if ($arrResult !== FALSE && $arrResult !== NULL)
		{
			// Conversion of the string result array to objects
			$arrRet = array();

			if (count($arrResult) > 0)
			{
				// Storing the keys of the result columns to use them as 
				// attributes.
				$arrKeys = array_keys($arrResult[0]);

				foreach ($arrResult as $Entry)
				{
					$tmpClass = new ResultObject ();
					foreach ($arrKeys as $Key)
					{
						$tmpClass->$Key = $Entry[$Key];
					}

					$arrRet[] = $tmpClass;
				}
			}

			return $arrRet;
		}

		return $arrResult;
	}


	/**********************************************************************
	 * SqlGetPreparedLines ()
	 * 
	 * Executes an SQL statement that was prepared with SqlPrepareStatement()
	 * with the set in parameters and returns the Result as array which can
	 * be accessed via index ($result[0][2]) or name ($result[0]['name']),
	 * depending on the FETCH_MODE that was set in SqlPrepareStatement().
	 * 
	 * @param array $ParameterArray (optional) One dimensional array with values
	 *                              to replace the '?' placeholders or key-value
	 *                              pairs to replace the ':name' placeholders                            
	 * 
	 * @return array Result of the query, NULL if no result was found or FALSE,
	 *               if an error occured
	 */
	public function SqlGetPreparedLines ( $ParameterArray = NULL )
	{
		$this->startExecutionTimer();

		if ($this->_PDOStatementPrepared != NULL)
		{
			if ($this->_PDOStatementPrepared->execute($ParameterArray))
			{
				if (($returnMixed = 
					$this->_PDOStatementPrepared->fetchAll()) !== FALSE)
				{
					$this->stopExecutionTimer();
					return count($returnMixed) == 0 ? NULL : $returnMixed;
				}

				$arrTemp = $this->_PDOStatementPrepared->errorInfo();

				// fetch() returns FALSE, if the result is empty, even if there
				// was no error. This has to be "corrected".
				if ($arrTemp[0] == "00000")
				{
					$this->stopExecutionTimer();
					return NULL;
				}

				$this->_LastErrorMessage = $arrTemp[2];
			}
			else
			{
				$arrTemp = $this->_PDOStatementPrepared->errorInfo();
				$this->_LastErrorMessage = $arrTemp[2];
			}
		}

		$this->stopExecutionTimer();
		return FALSE;
	}


	/**********************************************************************
	 * SqlGetPreparedLinesAsObject ()
	 * 
	 * Executes an SQL statement that was prepared with SqlPrepareStatement()
	 * with the set in parameters and returns the Result as array of objects 
	 * which can be accessed via it's attributes ($result[0]->name) 
	 * depending on the FETCH_MODE that was set in SqlPrepareStatement().
	 * 
	 * @param array $ParameterArray (optional) One dimensional array with values
	 *                              to replace the '?' placeholders or key-value
	 *                              pairs to replace the ':name' placeholders
	 * 
	 * @return array Result of the query as array of objects, NULL if no result 
	 *               was found or FALSE, if an error occured
	 */
	public function SqlGetPreparedLinesAsObject ( $ParameterArray = NULL )
	{
		$arrResult = $this->SqlGetPreparedLines($ParameterArray);

		if ($arrResult !== FALSE && $arrResult !== NULL)
		{
			// Converting the returned array in return objects
			$arrRet = array();

			if (count($arrResult) > 0)
			{
				// Storing the returned columns/keys of the first line
				$arrKeys = array_keys($arrResult[0]);

				foreach ($arrResult as $Entry)
				{
					$tmpClass = new ResultObject ();
					foreach ($arrKeys as $Key)
					{
						$tmpClass->$Key = $Entry[$Key];
					}

					$arrRet[] = $tmpClass;
				}
			}

			return $arrRet;
		}

		return $arrResult;
	}


	/**********************************************************************
	 * SqlGetFirstLine ()
	 * 
	 * Returns the first line of the SQL query result as array, that can be
	 * accessed via index ($result[0][1]) or name ($result[0]['name']).
	 * Important! This mehtod has always (!) to be called prior to a usage of
	 * SqlGetNextLine() or SqlGetnextLineAsObject().
	 * 
	 * @param string $SqlQuery SQL query to execute with optional usage of table
	 *                         prefix placeholders.
	 * 
	 * @return array First line of the query result as index based or assocciative
	 *               array, NULL if no result was found or FALSE, if an error
	 *               occured.
	 */
	public function SqlGetFirstLine ($SqlQuery)
	{
		if ($this->_PDOStatement != NULL)
		{
			$this->_PDOStatement->closeCursor();
		}

		if (($this->_PDOStatement = $this->sqlGetPDOObject($SqlQuery)) !== FALSE)
		{
			if (($returnMixed = $this->_PDOStatement->fetch(PDO::FETCH_BOTH, 
				PDO::FETCH_ORI_FIRST)) !== FALSE)
			{
				return $returnMixed;
			}

			$arrTemp = $this->_PDOStatement->errorInfo();

			// fetch() returns FALSE, of no result was found, even if there was
			// no error. This has to be "corrected".
			if ($arrTemp[0] == "00000")
			{
				return NULL;
			}

			$this->_LastErrorMessage = $arrTemp[2];
		}

		return FALSE;
	}


	/**********************************************************************
	 * SqlGetFirstPreparedLine ()
	 * 
	 * Returns the first line of the SQL query prepared by SqlPrepareStatement()
	 * as array that can be accessed by index ($result[0][2]) or name
	 * ($result[0]['name']).
	 * Important! This method has always to be called prior to a usage of
	 *            SqlGetNextpreparedLine() or SqlGetNextPreparedLineAsObject().
	 * 
	 * @param array $ParameterArray (optional) One dimensional array with values
	 *                              to replace the '?' placeholders or key-value
	 *                              pairs to replace the ':name' placeholders
	 * 
	 * @return array Result of the query as array of objects, NULL if no result 
	 *               was found or FALSE, if an error occured
	 */
	public function SqlGetFirstPreparedLine ( $ParameterArray = NULL )
	{
		if ($this->_PDOStatementPrepared != NULL)
		{
			if ($this->_PDOStatementPrepared->execute($ParameterArray))
			{
				if (($returnMixed = 
					$this->_PDOStatementPrepared->fetch(PDO::FETCH_BOTH,
							  PDO::FETCH_ORI_FIRST)) !== FALSE)
				{
					return count($returnMixed) == 0 ? NULL : $returnMixed;
				}

				$arrTemp = $this->_PDOStatementPrepared->errorInfo();

				// fetch() returns FALSE, of no result was found, even if there was
				// no error. This has to be "corrected".
				if ($arrTemp[0] == "00000")
				{
					return NULL;
				}

				$this->_LastErrorMessage = $arrTemp[2];
			}
			else
			{
				$arrTemp = $this->_PDOStatementPrepared->errorInfo();
				$this->_LastErrorMessage = $arrTemp[2];
			}
		}

		return FALSE;
	}


	/**********************************************************************
	 * SqlGetFirstPreparedLineAsObject ()
	 * 
	 * Returns the first line of the SQL query prepared with SqlPrepareStatement()
	 * as array of objects  which can be accessed via it's attributes 
	 * ($result[0]->name) 
	 *  
	 * @param array $ParameterArray (optional) One dimensional array with values
	 *                              to replace the '?' placeholders or key-value
	 *                              pairs to replace the ':name' placeholders
	 * 
	 * @return array Result of the query as array of objects, NULL if no result 
	 *               was found or FALSE, if an error occured
	 */
	public function SqlGetFirstPreparedLineAsObject ( $ParameterArray = NULL )
	{
		$arrResult = $this->SqlGetFirstPreparedLine($ParameterArray);

		if ($arrResult !== FALSE)
		{
			if (count($arrResult) > 0)
			{
				// Storing returned columns/keys of the first line
				$arrKeys = array_keys($arrResult);

				$tmpClass = new ResultObject ();

				foreach ($arrKeys as $Key)
				{
					$tmpClass->$Key = $arrResult[$Key];
				}

				return $tmpClass;
			}
			else
			{
				return NULL;
			}
		}

		return FALSE;
	}


	/**********************************************************************
	 * SqlGetFirstLineAsObject ()
	 * 
	 * Returns the first line of an SQL statement as array of objects, where 
	 * the columns can be accessed as object attributes ($result[0]->name or 
	 * $result[0]->city).
	 * Important! This method has always to be called prior to a usage of
	 *            SqlGetNextLine() or SqlGetNextLineAsObject().
	 * 
	 * @param string $SqlQuery SQL query to execute
	 * 
	 * @return array First line of the result as an array of objects or FALSE,
	 *               if an error occured.
	 */
	public function SqlGetFirstLineAsObject ($SqlQuery)
	{
		$arrResult = $this->SqlGetFirstLine($SqlQuery);

		if ($arrResult !== FALSE)
		{
			if (count($arrResult) > 0)
			{
				// Storing returned columns/keys of the first line
				$arrKeys = array_keys($arrResult);

				$tmpClass = new ResultObject ();

				foreach ($arrKeys as $Key)
				{
					$tmpClass->$Key = $arrResult[$Key];
				}

				return $tmpClass;
			}
			else
			{
				return NULL;
			}
		}

		return FALSE;
	}


	/**********************************************************************
	 * SqlGetNextLine ()
	 * 
	 * Returns the next line of the SQL query executed by SqlGetFirstLine() or
	 * SqlGetFirstLineAsObject() as array that can be accessed by index 
	 * ($result[0][2]) or name ($result[0]['name']).
	 * Important! One of the methods listet above has to be executed prior to 
	 *            a usage of this method.
	 * 
	 * @return array Next line of the query result, NULL if no further result
	 *               exists or FALSE, if an error occured.
	 */
	public function SqlGetNextLine ()
	{
		if ($this->_PDOStatement == NULL)
		{
			$this->_LastErrorMessage = 'SqlGetFirstLine() not executed';
			return FALSE;
		}

		try
		{
			if (($returnMixed = $this->_PDOStatement->fetch(PDO::FETCH_BOTH, 
					PDO::FETCH_ORI_NEXT)) === FALSE)
			{
				// fetch() returns FALSE in an error case and when no further
				// result could be found. This return value is separated in
				// FALSE (error) and NULL (nur further result).
				$arrTemp = $this->_PDOStatement->errorInfo();
				if (($this->_LastErrorMessage = $arrTemp[2]) === NULL)
				{
					// Manually setting the "no further data"-return value and
					// resetting the database cursor.
					$returnMixed = NULL;
					$this->_PDOStatement->closeCursor();
					$this->_PDOStatement = NULL;
				}
			}

			return $returnMixed;
		}
		catch (PDOException $e)
		{
			$this->_LastErrorMessage = $e->getMessage();
			return FALSE;
		}
	}


	/**********************************************************************
	 * SqlGetNextPreparedLine ()
	 * 
	 * Returns the next line of the query result prepared with SqlPrepareStatement()
	 * as array that can be accessed by index ($result[0][2]) or name
	 * ($result[0]['name']).
	 * Important! SqlGetFirstPreparedLine() or SqlGetFirstPreparedLineAsObject()
	 *            has to be called prior to this method.
	 * 
	 * @return array Next line of the prepared statement result as array, NULL
	 *               if no further result exists or FALSE if an error occured.
	 */
	public function SqlGetNextPreparedLine ()
	{
		if ($this->_PDOStatementPrepared == NULL)
		{
			$this->_LastErrorMessage = 'SqlStatement not prepared';
			return FALSE;
		}

		try
		{
			if (($returnMixed = $this->_PDOStatementPrepared->fetch(PDO::FETCH_BOTH, 
					PDO::FETCH_ORI_NEXT)) === FALSE)
			{
				// fetch() returns FALSE in an error case and when no further
				// result could be found. This return value is separated in
				// FALSE (error) and NULL (nur further result).
				$arrTemp = $this->_PDOStatementPrepared->errorInfo();
				if (($this->_LastErrorMessage = $arrTemp[2]) === NULL)
				{
					// Manually setting the "no further data"-return value and
					// resetting the database cursor.
					$returnMixed = NULL;
				}
			}

			return $returnMixed;
		}
		catch (PDOException $e)
		{
			$this->_LastErrorMessage = $e->getMessage();
			return FALSE;
		}
	}


	/**********************************************************************
	 * SqlGetNextLineAsObject ()
	 * 
	 * Returns the next line of the SQL query executed by SqlGetFirstLine() or
	 * SqlGetFirstLineAsObject() as object, where the columns can be accessed
	 * via it's properties ($result[0]->name)
	 * Important! One of the methods listet above has to be executed prior to 
	 *            a usage of this method.
	 * 
	 * @return array Next line of the query result as object, NULL if no further 
	 *               result exists or FALSE, if an error occured.
	 */
	public function SqlGetNextLineAsObject ()
	{
		$arrResult = $this->SqlGetNextLine();

		if ($arrResult !== FALSE)
		{
			if (count($arrResult) > 0)
			{
				// Storing returned columns/keys of the first line
				$arrKeys = array_keys($arrResult);

				$tmpClass = new ResultObject ();

				foreach ($arrKeys as $Key)
				{
					$tmpClass->$Key = $arrResult[$Key];
				}

				return $tmpClass;
			}
			else
			{
				return NULL;
			}
		}

		return FALSE;
	}


	/**********************************************************************
	 * SqlGetNextPreparedLineAsObject ()
	 * 
	 * Returns the next line of the query result prepared with SqlPrepareStatement()
	 * as object that can be accessed by it's properties ($result[0]->name)
	 * Important! SqlGetFirstPreparedLine() or SqlGetFirstPreparedLineAsObject()
	 *            has to be called prior to this method.
	 * 
	 * @return array Next line of the prepared statement result as object, NULL
	 *               if no further result exists or FALSE if an error occured.
	 */
	public function SqlGetNextPreparedLineAsObject ()
	{
		$arrResult = $this->SqlGetNextPreparedLine();

		if ($arrResult !== FALSE)
		{
			if (count($arrResult) > 0)
			{
				// Storing returned columns/keys of the first line
				$arrKeys = array_keys($arrResult);

				$tmpClass = new ResultObject ();

				foreach ($arrKeys as $Key)
				{
					$tmpClass->$Key = $arrResult[$Key];
				}

				return $tmpClass;
			}
			else
			{
				return NULL;
			}
		}

		return FALSE;
	}


	/**********************************************************************
	 * SqlGetExecutionTime ()
	 * 
	 * Returns the duration of the last executed SQL query in miliseconds.
	 * 
	 * @return int Execution time of the last executed query in miliseconds or
	 *             FALSE if an error occured, if the current query is still
	 *             executed of if the last query was finished with errors.
	 */
	public function SqlGetExecutionTime ()
	{
		if ($this->_ExecutionTime == 0)
		{
			$this->_LastErrorMessage = 'no execution time available';
			return FALSE;
		}

		try
		{
			return (int)($this->_ExecutionTime * 1000);
		}
		catch (Exception $e)
		{
			$this->_LastErrorMessage = $e->getMessage();
			return FALSE;
		}

	}

	
	/**********************************************************************
	 * SqlHasResult ()
	 * 
	 * Checks, if the given SELECT statement would return at least one result.
	 * This can be helpful if you want to check prior to an UPDATE statement,
	 * if the dataset to update exists.
	 * Important! Because this method can return both FALSE and false every
	 *            comparison should be done with "===" or "!==".
	 * 
	 * @return bool true if the given SELECT statement would return at least
	 *              one result, false if the query wouldn't return a result or
	 *              FALSE, if an error occured.
	 */
	public function SqlHasResult ( $SqlQuery )
	{
		$resultReturn = $this->sqlGetPDOObject($SqlQuery);

		if ($resultReturn !== FALSE)
		{
			if ($resultReturn->fetch() === false)
				return false;
			else
				return true;
	   }

		return FALSE;
	}
	
}	




/*******************************************************************************
 * Internal class for the return of objects in SqlGetLinesAsObject(),
 * SqlGetFirstLineAsObject() etc. with all database columns as class
 * attributes.
 ******************************************************************************/
class ResultObject {}