const express = require("express");
const dbConnection = require("./db/db");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const xlsx = require("xlsx");
const fileUpload = require("express-fileupload");
const { error } = require("console");
const { default: puppeteer } = require("puppeteer");
const validator = require("validator")
const util = require("util")

/*const https = require("https");
const fs = require("fs");*/

const app = express();

/*
const privateKey = fs.readFileSync('./certificados/key.pem', 'utf8');
const certificate = fs.readFileSync('./certificados/cert.pem', 'utf8');
const credentials = {key: privateKey, cert:certificate}
const httpsServer = https.createServer(credentials, app)
*/

app.use(
  cors({
    origin: ["http://192.168.1.9:3000"],
    methods: ["POST", "GET", "PUT", "DELETE", "HEAD", "PATCH"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.static("public"));

/*habilitacion de toquen */
const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ Error: "You are no Authemticated" });
  } else {
    jwt.verify(token, "jwt-secret-key", (err, decoded) => {
      if (err) return res.json({ Error: "Token wrong" });
      req.role = decoded.role;
      req.id = decoded.id;
      next();
    });
  }
};

/*Detalle de datos manuales*/
app.get("/detmanual/:gest", (req, res) => {
  const gest = req.params.gest;
  const sql = "SELECT * FROM dmanual WHERE gest = ?";
  dbConnection.query(sql, [gest], (err, result) => {
    if (err) return res.json({ Error: "Error in runnig query" });
    return res.json({ Status: "Success", Result: result });
  });
});

/*Detalle de dashboard*/
app.get("/dashboard", verifyUser, (req, res) => {
  return res.json({ Status: "Success", role: req.role, id: req.id });
});

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const multerUpload = multer({ storage: multerStorage });

/*Detalle de empleados */
app.get("/getemp", (req, res) => {
  const sql =
    "SELECT `empid`, CONCAT(`lastname`,' ',`lastname2`,' ',`firstname`,' ',`middlename`) as fname  FROM employee";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Get employee error in sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

app.get("/payempd", (req, res) => {
  const sql =
    "SELECT PY.`id`,PY.`empid`, EM.`firstname`, EM.`middlename`, EM.`lastname`, EM.`lastname2` FROM payusr AS PY INNER JOIN employee AS EM ON PY.empid = EM.empid";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Get payuser error in sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

/*Detalle de empleados con gestion */
app.get("/get/:id", (req, res) => {
  const id = req.params.id;
  const sql =
    "SELECT *, YEAR(startdate) as anio, MONTH(startdate) as mes, DAY(startdate) as dia  FROM employee where empid = ?";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "Get employee error in sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

app.put("/updatepass/:id", async(req, res) => {
  const id = req.params.id;
  const { password } = req.body;
  try{
    const hashedPassword = await bcrypt.hash(password, 10)
    const sql = "UPDATE `RRHH`.`employee` SET `password` = ? WHERE `empid` = ?";
    const values = [hashedPassword, id];
    dbConnection.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error al actualizar empleado", err);
      return res.status(500).json({ Error: "Error al actualizar empleado" });
    }
    return res.json({ Status: "Success" });
  });
  }catch (error) {
    console.log('Error al cifrar la contraseña', error);
    return res.status(500).json({Error: "Error al cifrar la contraseña"})
  }
});

/*Actualizacion de empleados */
app.put("/update/:id", (req, res) => {
  const id = req.params.id;
  const {
    martstatus,
    mobile,
    addresshome,
    addresswork,
    dept,
    branch,
    termdate,
    reasonterm,
    salary,
    nchildren,
    birthcountry,
    nua,
    position,
    profession,
    bank,
    codbank,
    estado,
    scheacco,
    linkedin,
    useredit,
  } = req.body;
  const sql =
    "UPDATE employee set `martstatus` = ? ,`mobile` = ? , `addresshome` = ?, `addresswork` = ?, `dept` = ?, `branch`= ?,`termdate` = ?,`reasonterm` = ?,`salary` = ?,`nchildren` = ?,`birthcountry` = ?,`nua` = ?,`position` = ?,`profession` = ?,`bank` = ?,`codbank` = ?,`estado` = ?,`scheacco` = ?, `linkedin`= ?, `useredit`= ?  WHERE empid = ?";
  const values = [
    martstatus,
    mobile,
    addresshome,
    addresswork,
    dept,
    branch,
    termdate,
    reasonterm,
    salary,
    nchildren,
    birthcountry,
    nua,
    position,
    profession,
    bank,
    codbank,
    estado,
    scheacco,
    linkedin,
    useredit,
    id,
  ];
  dbConnection.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error al actualizar empleado", err);
      return res.status(500).json({ Error: "Error al actualizar empleado" });
    }
    return res.json({ Status: "Success" });
  });
});

/*Usuarios de administracion */
app.get("/userdets", (req, res) => {
  const sql = "SELECT username FROM user";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error in running" });
    return res.json(result);
  });
});

/*Cantidad de empleados */
app.get("/adminCount", (req, res) => {
  const sql = "SELECT count(id) as admin FROM user";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error in runnig query" });
    return res.json(result);
  });
});

/*Total de salarios */
app.get("/salary", (req, res) => {
  const sql =
    "SELECT cast(sum(salary) as decimal(10,2)) as sumOfSalary from employee";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error in runnig query" });
    return res.json(result);
  });
});

/*Cantidad de empleados */
app.get("/employeeCount", (req, res) => {
  const sql = "SELECT count(empid) as employee from employee";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error in runnig query" });
    return res.json(result);
  });
});

/*Cantidad de mujeres */
app.get("/employeefem", (req, res) => {
  const sql = "SELECT count(sex) from employee where sex='02'";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error in runnig query" });
    return res.json(result);
  });
});

/*Cantidad de hombres*/
app.get("/employeemas", (req, res) => {
  const sql = "SELECT count(sex) from employee where sex='01'";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error in runnig query" });
    return res.json(result);
  });
});

/*Empleados detallado */
app.get("/getemployee", (req, res) => {
  const sql =
    "SELECT *,DATE_FORMAT(birthdate,'%Y-%m-%d') birthdate ,DATE_FORMAT(startdate,'%Y-%m-%d') startdate  ,DAY(startdate)AS DIA, MONTH(startdate) AS MES, YEAR(startdate) as ANIO, CASE WHEN ext='01' then 'LP' WHEN ext='02' then 'SC' WHEN ext='03' then 'CB' WHEN ext='04' then 'CH' WHEN ext='05' then 'PO' WHEN ext='06' then 'OR' WHEN ext='07' then 'TJ' WHEN ext='08' then 'BE' WHEN ext='09' then 'PA' else 'Extranjero' end extci, case when sex='01'then 'Hombre' else 'Mujer' end sexo, case when martstatus='01' then 'Casado(a)' when martstatus='02' then 'Soltero(a)' when martstatus='03' then 'Viudo(a)' when martstatus='04' then 'Vidorsiado(a)' else '' end marstatuse, case when bank='01' then 'Mercantil Santa Cruz' when bank='02' then 'UNION' when bank='03' then 'BISA' when bank='04' then 'BCP' when bank='05' then 'Prodem' else '' end banks FROM employee order by lastname";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error al obtener empleado sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

//Configuracion de usuarios

/*Lista d eusuario*/
app.get("/usera", (req, res) => {
  const sql = "SELECT * FROM user";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error al obtener usuarios sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

/*Crear usuarios*/
app.post("/creauser", (req, res) => {
  const sql =
    "INSERT INTO user (`username`,`email`,`password`,`role`) VALUES (?)";
  bcrypt.hash(req.body.password.toString(), 10, (err, hash) => {
    if (err) return res.json({ Error: "Error in hashing password" });
    const values = [req.body.username, req.body.email, hash, req.body.role];
    dbConnection.query(sql, [values], (err, result) => {
      if (err) return res.json({ Error: "Inside query" });
      return res.json({ Status: "Success" });
    });
  });
});

/*Eliminar usuarios*/
app.delete("/deluser/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM user WHERE id = ?";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete error in sql" });
    return res.json({ Status: "Success" });
  });
});

/*Usuarios planilla */
app.post("/payempus", (req, res) => {
  const sql = "INSERT INTO payusr (`empid`) VALUES (?)";
  const values = [req.body.empid];
  dbConnection.query(sql, [values], (err, result) => {
    if (err)
      if (err.code === "ER_DUP_ENTRY") {
        return res.json({
          Error: "El valor de empleado ya existe en la tabla",
        });
        /*console.log(values);*/
      } else {
        return res.json({
          Error: "Error en la consulta",
          ErrorMessage: err.message,
        });
      }
  });
});

/*Lista de gestiones*/
app.get("/gest", (req, res) => {
  const sql = "SELECT * FROM gest";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error al obtener gestion sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

app.get("/gestdet", (req, res) => {
  const sql = "SELECT `gest` from gest";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error al obtener gestion sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

/*Crear gestion*/
app.post("/creagest", (req, res) => {
  const sql = "INSERT INTO gest (`gest`,`descr`) VALUES (?)";
  const values = [req.body.gest, req.body.descr];
  dbConnection.query(sql, [values], (err, result) => {
    if (err)
      return res.json({
        Error: "Inside singup query",
        ErrorMessage: err.message,
      });
    /* console.log(values);*/
    return res.json({ Status: "Success" });
  });
});

/*Eliminar gestion*/
app.delete("/delpayem/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM payusr WHERE id = ?";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete payemp error in sql " });
    return res.json({ Status: "Success" });
  });
});

/*eliminar gestiones*/
app.delete("/delgest/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM gest WHERE id = ?";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete gestion error in sql" });
    return res.json({ Status: "Success" });
  });
});

/*crear ufv*/
app.post("/creaufv", (req, res) => {
  const sql = "INSERT INTO ufv (`montmay`,`montmen`, `gest`) VALUES (?)";
  const values = [req.body.montmay, req.body.montmen, req.body.gest];
  dbConnection.query(sql, [values], (err, result) => {
    if (err)
      return res.json({
        Error: "Inside singup query",
        ErrorMessage: err.message,
      });
    /*console.log(values);*/
    return res.json({ Status: "Success" });
  });
});

/*detalle ufv*/
app.get("/ufvinfo", (req, res) => {
  const sql = "SELECT * FROM ufv";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error al obtener ufv sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

/*detalle ufv para que no se repita gestion*/
app.get("/ufvdet", (req, res) => {
  const sql = "SELECT `gest` FROM ufv";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error al obtener ufv" });
    return res.json({ Status: "Success", Result: result });
  });
});

/*Eliminar UFV */
app.delete("/delufv/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM ufv WHERE id = ?";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete gestion error in sql" });
    return res.json({ Status: "Success" });
  });
});

/*Crear esquemas */
app.get("/creasche", (req, res) => {
  const sql =
    "INSERT INTO setschem (`descripsche`,`detcount1`,`detcount2`,`detcount3`,`detcount4`,`detcount5`,`detcount6`,`detcount7`,`detcount8`) VALUES (?)";
  const values = [
    req.body.descripsche,
    req.body.detcount1,
    req.body.detcount2,
    req.body.detcount3,
    req.body.detcount4,
    req.body.detcount5,
    req.body.detcount6,
    req.body.detcount7,
    req.body.detcount8,
  ];
  dbConnection.query(sql, [values], (err, result) => {
    if (err)
      return res.json({
        Error: "Inside singup query",
        ErrorMessage: err.message,
      });
    return res.json({ Status: "Success" });
  });
});

/*Detalle de esquemas */
app.get("/scheinfo", (req, res) => {
  const sql = "SELECT * FROM detschem";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error al obtener gestion sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

/*Eliminar esquemas */
app.delete("/delsche/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM detschem WHERE id = ?";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete gestion error in sql" });
    return res.json({ Status: "Success" });
  });
});

/*Eliminar empleados*/
app.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM employee WHERE empid = ?";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete employee error in sql" });
    return res.json({ Status: "Success" });
  });
});

/*Crear departamento*/
app.post("/creadept", (req, res) => {
  const sql = "INSERT INTO depart (`details`) VALUES (?)";
  const values = [req.body.details];
  dbConnection.query(sql, values, (err, result) => {
    if (err)
      return res.json({
        Error: "Inside singup query",
        ErrorMessage: err.message,
      });
    /*console.log(values);*/
    return res.json({ Status: "Success" });
  });
});

/*Eliminar empleado */
app.delete("/deldept/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM depart WHERE id = ?";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete department error in sql" });
    return res.json({ Status: "Success" });
  });
});

/*Detalle de departamento */
app.get("/depart", (req, res) => {
  const sql = "SELECT * FROM depart";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error in runnig query" });
    return res.json({ Status: "Success", Result: result });
  });
});

/*Crear planilla */
app.post("/creapay", (req, res) => {
  const sql = "INSERT INTO crepay (`gestion`,`datecalc`,`estate`) VALUES (?)";
  const values = [req.body.gestion, req.body.datecalc, req.body.estate];
  dbConnection.query(sql, [values], (err, result) => {
    if (err)
      return res.json({
        Error: "Inside singup query",
        ErrorMessage: err.message,
      });
    return res.json({ Status: "Success" });
  });
});

/*Detalle de planilla */
app.get("/detapay", (req, res) => {
  const sql = "SELECT * FROM crepay";
  dbConnection.query(sql, (err, result) => {
    if (err) return res, json({ Error: "Error in runnig query" });
    return res.json({ Status: "Success", Result: result });
  });
});

/*Detalle de gestion */
app.get("/detapayg", (req, res) => {
  const sql = "SELECT `gestion` gest FROM crepay";
  dbConnection.query(sql, (err, result) => {
    if (err) return res, json({ Error: "Error in runnig query" });
    return res.json({ Status: "Success", Result: result });
  });
});

/*Para no duplicar empleados */
app.get("/detci", (req, res) => {
  const sql = "select `ci` from employee";
  dbConnection.query(sql, (err, result) => {
    if (err) return res, json({ Error: "Error in runnig query" });
    return res.json({ Status: "Success", Result: result });
  });
});

/*Eliminar planilla */
app.get("/delepay/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM crepay WHERE id = ?";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete creapay error in sql" });
    return res.json({ status: "Success" });
  });
});

/*Detalle de sucursales*/
app.get("/branch", (req, res) => {
  const sql = "SELECT * FROM branch";
  dbConnection.query(sql, (err, result) => {
    if (err) return res, json({ Error: "Error in runnig query" });
    return res.json({ Status: "Success", Result: result });
  });
});

/*Crear sucursales nuevas*/
app.post("/creabranch", (req, res) => {
  const sql = "INSERT INTO branch (`details`) VALUES (?)";
  const values = [req.body.details];
  dbConnection.query(sql, values, (err, result) => {
    if (err)
      return res.json({
        Error: "Inside singup query",
        ErrorMessage: err.message,
      });
    /*console.log(values);*/
    return res.json({ Status: "Success" });
  });
});

/*Eliminar sucursales */
app.delete("/delbranc/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM branch WHERE id = ?";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete branch error in sql" });
    return res.json({ Status: "Success" });
  });
});

/*Eliminar de empleados */
app.delete("/deldtma/:gest", (req, res) => {
  const gest = req.params.gest;
  const sql = "DELETE FROM dmanual where gest = ?";
  dbConnection.query(sql, [gest], (err, result) => {
    if (err) return res.json({ Error: "delete dmanules error in sql" });
    return res.json({ Status: "Successs" });
  });
});

function isValidEmail(email) {
  return validator.isEmail(email);
}

/*Acceso de administrador*/
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const sql = "SELECT * FROM user WHERE email = ?";
  dbConnection.query(sql, [email], async (err, result) => {
    if (err) {
      return res.json({ Status: "Error", Error: "Error in running query" });
    }

    if (result.length === 0) {
      return res.json({ Status: "Error", Error: "Wrong Email or password" });
    }

    const storedHash = result[0].password;

    try {
      const match = await bcrypt.compare(password, storedHash);

      if (match) {
        // La contraseña es correcta, puedes realizar acciones adicionales, como generar un token JWT
        const id = result[0].id;
        const token = jwt.sign({ role: "01" }, "jwt-secret-key", {
          expiresIn: "2h",
        });
        res.cookie("token", token);
        return res.json({ Status: "Success", result: result[0].username });
      } else {
        return res.json({ Status: "Error", Error: "Wrong Email or password" });
      }
    } catch (error) {
      console.error("Error al comparar contraseñas:", error.message);
      return res.json({
        Status: "Error",
        Error: "Error al comparar contraseñas",
      });
    }
  });
});

/*Accesos de empleados*/

const queryAsync = util.promisify(dbConnection.query).bind(dbConnection)

app.post('/employeelogin', async (req, res) => {
  const { email, password } = req.body;

  if (!isValidEmail(email)) {
    return res.json({ Status: 'Error', Error: 'Correo electrónico inválido' });
  }

  try {
    const [rows] = await queryAsync('SELECT empid, email, password, role FROM employee WHERE email = ?', [email]);
    /*console.log(rows.password, password)*/
    if (rows.length === 0) {
      return res.json({ Status: 'Error', Error: 'Correo electrónico o contraseña incorrectos' });
      
    }

    const match = await bcrypt.compare(password, rows.password);
    
    if (match) {
      const token = jwt.sign({ role: '02' }, 'jwt-secret-key', { expiresIn: '2h' });
      res.cookie('token', token); /*, { httpOnly: true, secure: true }*/
      return res.json({ Status: 'Success', id: rows.empid });
    } else {
      return res.json({ Status: 'Error', Error: 'Correo electrónico o contraseña incorrectos' });
    }
  } catch (error) {
    console.error('Error al autenticar empleado:', error.message);
    
    return res.json({ Status: 'Error', Error: 'Error al autenticar empleado' });
  }
});

/*app.post("/employeelogin", (req, res) => {
  const sql = "SELECT * FROM employee WHERE email = ?";

  dbConnection.query(sql, [req.body.email], (err, result) => {
    if (err)
      return res.json({ Status: "Error", Error: "Error in runnig query" });
    if (result.length > 0) {
      bcrypt.compare(
        req.body.password.toString(),
        result[0].password,
        (err, response) => {
          if (err) return res.json({ Error: "password error" });
          if (response) {
            const token = jwt.sign({ role: "02" }, "jwt-secret-key", {
              expiresIn: "2h",
            });
            res.cookie("token", token, { httpOnly: true, secure: true });

            return res.json({ Status: "Success", id: result[0].empid });
          } else {
            return res.json({
              Status: "Error",
              Error: "Wrong email or password",
            });
          }
        }
      );
    }
  });
});
*/
/*Crear empleado*/
app.post("/create", multerUpload.single("image"), (req, res) => {
  const sql =
    "INSERT INTO employee (`firstname`,`middlename`,`lastname`,`lastname2`,`ci`,`ext`,`birthdate`,`sex`,`martstatus`,`mobile`,`addresshome`,`addresswork`,`dept`,`branch`,`startdate`,`termdate`,`reasonterm`,`salary`,`nchildren`,`birthcountry`,`nua`,`afp`,`tipjub`,`position`,`profession`,`bank`,`codbank`,`password`,`email`,`role`,`estado`,`linkedin`,`image`) VALUES (?)";
  bcrypt.hash(req.body.password.toString(), 10, (err, hash) => {
    if (err) return res.json({ Error: "Error en hashing password" });
    const { filename } = req.file;
    const imagePath = filename;
    const termdate = req.body.termdate ? req.body.termdate : null;
    const values = [
      req.body.firstname,
      req.body.middlename,
      req.body.lastname,
      req.body.lastname2,
      req.body.ci,
      req.body.ext,
      req.body.birthdate,
      req.body.sex,
      req.body.martstatus,
      req.body.mobile,
      req.body.addresshome,
      req.body.addresswork,
      req.body.dept,
      req.body.branch,
      req.body.startdate,
      termdate,
      req.body.reasonterm,
      req.body.salary,
      req.body.nchildren,
      req.body.birthcountry,
      req.body.nua,
      req.body.afp,
      req.body.tipjub,
      req.body.position,
      req.body.profession,
      req.body.bank,
      req.body.codbank,
      hash,
      req.body.email,
      req.body.role,
      req.body.estado,
      req.body.linkedin,
      imagePath,
    ];
    dbConnection.query(sql, [values], (err, result) => {
      if (err) return res.json({ Error: "Inside signup query" });
      return res.json({ Status: "Success" });
    });
  });
});

/*fileUpload para cargar a excel debe estar al final para no tener conflicto */
app.use(fileUpload());

app.post("/upload-excel", (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).send("No se cargo ningun archivo");
  }

  const file = req.files.file;
  const workbook = xlsx.read(file.data, { type: "buffer" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(worksheet);

  const inserQuery =
    "INSERT INTO dmanual (`gest`, `codemp`, `concept`, `mont`) VALUES ?";
  const values = data.map((row) => [
    row.gest,
    row.codemp,
    row.concept,
    row.mont,
  ]);
  dbConnection.query(inserQuery, [values], (err, result) => {
    if (err) {
      console.error("Error al insertar datos a la base", err);
      return res.status(500).json({ error: "Error al insertar datos" });
    }
    console.log("Datos insertados con exito");
    return res.json({ message: "Datos insertados con exito" });
  });
});

/*Cerrar sesion*/
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ status: "Success" });
});

/*Procedimiento para el Calculo de planilla */
app.get("/calpla/:id", (req, res) => {
  const id = req.params.id;
  dbConnection.query("CALL calPLa(?)", [id], (error, results) => {
    if (error) throw error;
    console.log(results[0]);
    if (results[0] === undefined) {
      res.json("");
    } else {
      res.json("C");
    }
  });
});

/*Procedimiento para eliminar calculos de planilla */
app.get("/delpla/:id", (req, res) => {
  const id = req.params.id;
  dbConnection.query("CALL delPla(?)", [id], (error, result) => {
    /*console.log(result);*/
    res.json(result);
  });
});

/*Reporte de calculo de planilla*/
app.get("/rplacalc/:id", (req, res) => {
  const id = req.params.id;
  dbConnection.query("CALL reportPG(?)", [id], (err, result) => {
    /*console.log(result);*/
    res.json({ Status: "Success", Result: result[0] });
  });
});

/*Reporte de aporte de planilla */
app.get("/rppro/:id", (req, res) => {
  const id = req.params.id;
  dbConnection.query("CALL reportAPO(?)", [id], (err, result) => {
    /*console.log(result);*/
    res.json({ Status: "Success", Result: result[0] });
  });
});

/*Liquido pagable total del mes actual*/
app.get("/rpliq", (req, res) => {
  dbConnection.query("CALL reportLIQ()", (err, result) => {
    /*console.log(result);*/
    res.json({ Status: "Success", Result: result[0] });
  });
});

/*Total ganado del mes actual */
app.get("/rptgan", (req, res) => {
  dbConnection.query("CALL reportTGA()", (err, result) => {
    /*console.log(result);*/
    res.json({ Status: "Success", Result: result[0] });
  });
});

/*Costo de empleados */
app.get("/rptcosem", (req, res) => {
  dbConnection.query("CALL repcosem('')", (err, result) => {
    /*console.log(result);*/
    res.json({ Status: "Success", Result: result[0] });
  });
});

/*Costo laboral */
app.get("/rptcolab", (req, res) => {
  dbConnection.query("CALL repcolab('')", (err, result) => {
    /*console.log(result);*/
    res.json({ Status: "Success", Result: result[0] });
  });
});

/*Costo beneficio empleado*/
app.get("/rptcoben", (req, res) => {
  dbConnection.query("CALL repcoben('')", (err, result) => {
    /*console.log(result);*/
    res.json({ Status: "Success", Result: result[0] });
  });
});

/*Reporte tasa de retenciones de empleado */
app.get("/rptcotre", (req, res) => {
  dbConnection.query("CALL repcotre('')", (err, result) => {
    /*console.log(result);*/
    res.json({ Status: "Success", Result: result[0] });
  });
});

/*Empleados del mes */
app.get("/rpbirth/:id", (req, res) => {
  const id = req.params.id;
  dbConnection.query("CALL birth(?)", [id], (err, result) => {
    /*console.log(result);*/
    res.json({ Status: "Success", Result: result[0] });
  });
});

/*Cantidad de hombres */
app.get("/rpsex", (req, res) => {
  const id = req.params.id;
  dbConnection.query("CALL sexemp()", (err, result) => {
    /*console.log(result);*/
    res.json({ Status: "Success", Result: result[0] });
  });
});

/*Cantidad de mujeres */
app.get("/rpsexm", (req, res) => {
  dbConnection.query("CALL sexempm()", (err, result) => {
    /*console.log(result);*/
    res.json({ Status: "Success", Result: result[0] });
  });
});

/*Nuevos empleados del mes */
app.get("/rpnewemp", (req, res) => {
  dbConnection.query("CALL newempmes()", (err, result) => {
    /*console.log(result);*/
    res.json({ Status: "Success", Result: result[0] });
  });
});

/*Vacaciones de empleados */
app.get("/rpvac", (req, res) => {
  dbConnection.query("CALL vacemp()", (err, result) => {
    res.json({ Status: "Success", Result: result[0] });
  });
});

/*Grafico de empleados por departamento */
app.get("/rpempfdep", (req, res) => {
  const sql =
    "select dept as departamento, count(*) as empleados from employee group by dept";
  dbConnection.query(sql, (err, result) => {
    res.json({ Status: "Success", Result: result });
  });
});

/*Crear vacacaiones */
app.post("/creavac", (req, res) => {
  const sql = "INSERT INTO vacSol (`empid`,`dsol`,`cday`,`estate`) VALUES (?)";
  const values = [
    req.body.empid,
    req.body.dsol,
    req.body.cday,
    req.body.estate,
  ];
  dbConnection.query(sql, [values], (err, result) => {
    if (err)
      return res.json({
        Error: "Inside singup query",
        ErrorMessage: err.message,
      });
    return res.json({ Status: "Success" });
  });
});

/*Detalle de vacaciones*/
app.get("/detvacp", (req, res) => {
  dbConnection.query("CALL dvacp()", (err, result) => {
    res.json({ Status: "Success", Result: result[0] });
  });
});

/*Autorizaciones de vacaiones solicitadas*/
app.get("/upvac/:id", (req, res) => {
  const id = req.params.id;
  const sql = "UPDATE `RRHH`.`vacSol` SET `estate` = 'A' WHERE `id` = ?";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error al actualizar empleado", err);
      return res.status(500).json({ Error: "Error al actualizar empleado" });
    }
    return res.json({ Status: "Success" });
  });
});

/*rechazo de vacaciones solicitadas*/
app.get("/upvacd/:id", (req, res) => {
  const id = req.params.id;
  const sql = "UPDATE `RRHH`.`vacSol` SET `estate` = 'R' WHERE `id` = ?";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error al actualizar empleado", err);
      return res.status(500).json({ Error: "Error al actualizar empleado" });
    }
    return res.json({ Status: "Success" });
  });
});

/*Detalle de vacaciones solicitados */
app.get("/nrosolp", (req, res) => {
  const sql =
    "SELECT IFNULL(count(estate),0) nsol FROM RRHH.vacSol WHERE estate='S'";
  dbConnection.query(sql, (err, result) => {
    res.json({ Status: "Success", Result: result });
  });
});

/*Detalle vacaciones empleados*/
app.get("/vacempp/:id", (req, res) => {
  const id = req.params.id;
  const sql = "CALL vacempp(?)";
  dbConnection.query(sql, [id], (err, result) => {
    res.json({ Status: "Success", Result: result[0] });
  });
});

/*vacaciones empleado por codigo */
app.get("/vacempd/:id", (req, res) => {
  const id = req.params.id;
  const sql = "CALL vacempdt(?)";
  dbConnection.query(sql, [id], (err, result) => {
    res.json({ Status: "Success", Result: result[0] });
  });
});

/*Reporte de planilla ministerio */
app.get("/repmin/:id", (req, res) => {
  const id = req.params.id;
  const sql = "CALL reportpgmin(?)";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) {
      res.status(500).json({ Status: "Error", Error: err });
    } else {
      (async () => {
        const broser = await puppeteer.launch();
        const page = await broser.newPage();

        const tableStyle = `
          width: 100%;
          margin: 0;
          font-size: 0.5rem;
          font-family: 'Roboto', sans-serif;
        `;
        const cellStyle = `
          border: 1px solid #ddd;
          padding: 4px;
          width: 30%;
        `;
        const divStyle = `
          text-align: center;
          padding: 10px;
        `;

        const gest = result[0][0].gest;
        console.log(gest);

        const content = `
        
          <div style="${divStyle}">
          <h1>Planilla mensual</h1>
          <h2>Correspondiente a la gestion ${gest}</h2> 
          <h2>Expresado en Boliviano</h2>
          </div>
        
          <table style="${tableStyle}">
          <tr>
              <th style="${cellStyle}">Código Empleado</th> 
              <th style="${cellStyle}">Nombre Completo</th>
              <th style="${cellStyle}">País de Nacimiento</th> 
              <th style="${cellStyle}">Fecha de Nacimiento</th> 
              <th style="${cellStyle}">Sexo</th>
              <th style="${cellStyle}">Cargo</th>
              <th style="${cellStyle}">Fecha de ingreso</th>
              <th style="${cellStyle}">Horas</th>
              <th style="${cellStyle}">Dias</th>
              <th style="${cellStyle}">Salario Basico</th>
              <th style="${cellStyle}">Salario Basico Calculado</th>
              <th style="${cellStyle}">Bono de antiguedad</th>
              <th style="${cellStyle}">Hrs. Extras</th>
              <th style="${cellStyle}">Hrs. Nocturnas</th>
              <th style="${cellStyle}">Dominicales</th>
              <th style="${cellStyle}">Fontera</th>
              <th style="${cellStyle}">Otros Ingresos</th>
              <th style="${cellStyle}">Total ganado</th>
              <th style="${cellStyle}">Aporte Laboral</th>
              <th style="${cellStyle}">Aporte may 13000</th>
              <th style="${cellStyle}">Aporte may 25000</th>
              <th style="${cellStyle}">Aporte may 35000</th>
              <th style="${cellStyle}">Impuesto retenido</th>
              <th style="${cellStyle}">Descuentos</th>
              <th style="${cellStyle}">Total Descuentos</th>
              <th style="${cellStyle}">Liquido Pagable</th>
                   

          </tr>
          ${result[0]
            .map(
              (item) => `
          <tr>
                <td style="${cellStyle}">${item.cod_emp}</td> 
                <td style="${cellStyle}">${item.nomc}</td>
                <td style="${cellStyle}">${item.birthcountry}</td> 
                <td style="${cellStyle}">${item.birth}</td>
                <td style="${cellStyle}">${item.sex}</td>
                <td style="${cellStyle}">${item.position}</td>
                <td style="${cellStyle}">${item.startd}</td>
                <td style="${cellStyle}">${item.hrs}</td>
                <td style="${cellStyle}">${item.TDT}</td>
                <td style="${cellStyle}">${item.SBB}</td>
                <td style="${cellStyle}">${item.SBC}</td>
                <td style="${cellStyle}">${item.ANT}</td>
                <td style="${cellStyle}">${item.MHE}</td>
                <td style="${cellStyle}">${item.MHN}</td>
                <td style="${cellStyle}">${item.DOM}</td>
                <td style="${cellStyle}">${item.FRO}</td>
                <td style="${cellStyle}">${item.OTA}</td>
                <td style="${cellStyle}">${item.TGA}</td>
                <td style="${cellStyle}">${item.LAB}</td>
                <td style="${cellStyle}">${item.S13}</td>
                <td style="${cellStyle}">${item.S25}</td>
                <td style="${cellStyle}">${item.S35}</td>
                <td style="${cellStyle}">${item.IRE}</td>
                <td style="${cellStyle}">${item.DE1}</td>
                <td style="${cellStyle}">${item.TDE}</td>
                <td style="${cellStyle}">${item.LIQ}</td>
                </tr>
              `
            )
            .join("")}
              
          </table>
        `;
        await page.setContent(content);
        const pdfBuffer = await page.pdf({ format: "legal", landscape: true });
        await broser.close();

        // Enviar el PDF como respuesta
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=reporte.pdf`
        );
        res.status(200).send(pdfBuffer);
      })();
    }
  });
});

/*Reporte de boleta de pagos */
app.get("/repbolt/:gest/:id", (req, res) => {
  const { gest, id } = req.params;
  const sql = "CALL reportpgminb(?,?)";
  dbConnection.query(sql, [gest, id], (err, result) => {
    if (err) {
      res.status(500).json({ Status: "Error", Error: err });
    } else {
      (async () => {
        const broser = await puppeteer.launch();
        const page = await broser.newPage();

        const cellStyle = `
          border: 1px solid #ddd;
          padding: 4px;
          
        `;
        const divStyle = `
          text-align: center;
          padding: 10px;
        `;
        const divStylen = `
          display:grid;
          grid-template-columns: 1fr 1fr;          
        
        `;
        const divStyletit = `
          display:grid;
          grid-template-columns: 1fr 1fr;
          
        `;

        const border = `
          margin-left: 30px;
          margin-right: 30px;
        `;

        const gest = result[0][0].gest;
        console.log(gest, id);

        const content = `
        
          <div style="${divStyle}">
          <h1>Boleta de pago</h1>
          <h2>Correspondiente a la gestion ${gest}</h2> 
          <h2>Expresado en Boliviano</h2>
          </div>
          ${result[0]
            .map(
              (item) => `
          <div style="${(divStylen, border)}">
            <div>Codigo: ${item.cod_emp}</div>
          </div>
          <div style="${(divStylen, border)}">
            <div>Nombre completo: ${item.nomc}</div>
          </div>
          <div style="${(divStylen, border)}">
            <div>Cargo: ${item.position}</div> 
          </div> 
          <div style="${(divStylen, border)}">
            <div>Fecha de ingreso: ${item.startd}</div> 
          </div> 
          <hr style="${border}">
          <div style="${divStyletit}">
            <div>
              <h3 style="${border}">INGRESOS</h3>
            </div> 
            <div>
              <h3 style="${border}">DESCUENTOS</h3>
            </div>
          </div>
          <hr style="${border}">

          <div style="${divStyletit}">
            <div>
              <div style="${divStylen}">
                <div style="${border}">Salario Basico:</div>
                <div>${item.SBB}</div> 
              </div>
            </div> 
            <div>
              <div style="${divStylen}">
                <div>Aportes laborales:</div> 
                <div>${item.LAB}</div>
              </div> 
            </div>
          </div>

          <div style="${divStyletit}">
            <div>
              <div style="${divStylen}">
                <div style="${border}">Dias Trabajados:</div>
                <div >${item.TDT}</div> 
              </div>
            </div> 
            <div>
              <div style="${divStylen}">
                <div>Aportes may. 13000:</div> 
                <div>${item.S13}</div>
              </div> 
            </div>
          </div>
          
          <div style="${divStyletit}">
            <div>
              <div style="${divStylen}">
                <div style="${border}">Salarios calculados:</div>
                <div>${item.SBC}</div> 
              </div>
            </div> 
            <div>
              <div style="${divStylen}">
                <div>Aportes may. 25000:</div> 
                <div>${item.S25}</div>
              </div> 
            </div>
          </div>
          
          <div style="${divStyletit}">
            <div>
              <div style="${divStylen}">
                <div style="${border}">Bono de antiguedad:</div>
                <div>${item.ANT}</div> 
              </div>
            </div> 
            <div>
              <div style="${divStylen}">
                <div>Aportes may. 35000:</div> 
                <div>${item.S35}</div>
              </div> 
            </div>
          </div>

          <div style="${divStyletit}">
          <div>
            <div style="${divStylen}">
              <div style="${border}">Horas Extras:</div>
              <div>${item.MHE}</div> 
            </div>
          </div> 
          <div>
            <div style="${divStylen}">
              <div></div> 
              <div></div>
            </div> 
          </div>
        </div>

        <div style="${divStyletit}">
          <div>
            <div style="${divStylen}">
              <div style="${border}">Horas Nocturnas:</div>
              <div>${item.MHN}</div> 
            </div>
          </div> 
          <div>
            <div style="${divStylen}">
              <div>Impuesto retenido</div> 
              <div>${item.IRE}</div>
            </div> 
          </div>
        </div>
          
        <div style="${divStyletit}">
          <div>
            <div style="${divStylen}">
              <div style="${border}">Dominicales:</div>
              <div>${item.DOM}</div> 
            </div>
          </div> 
          <div>
            <div style="${divStylen}">
              <div>Otros descuentos</div> 
              <div>${item.DE1}</div>
            </div> 
          </div>
        </div>
          
        <div style="${divStyletit}">
          <div>
            <div style="${divStylen}">
              <div style="${border}">Bono Frontera:</div>
              <div>${item.FRO}</div> 
            </div>
          </div> 
          <div>
            <div style="${divStylen}">
              <div></div> 
              <div></div>
            </div> 
          </div>
        </div>

        <div style="${divStyletit}">
        <div>
          <div style="${divStylen}">
            <div style="${border}">Otros ingresos:</div>
            <div>${item.OTA}</div> 
          </div>
        </div> 
        <div>
          <div style="${divStylen}">
            <div>Total descuentos:</div> 
            <div>${item.TDE}</div>
          </div> 
        </div>
      </div>
      <hr style="${border}">
      <div style="${divStyletit}">
        <div>
            <h3 style="${border}">TOTALES</h3>
            <div style="${divStylen}">
              <div style="${border}">TOTAL GANADO:</div> 
              <div>${item.TGA}</div>  
            </div>
        </div>
        <div>
            <h3>-</h3>
            <div style="${divStylen}">
              <div>LIQUIDO PAGABLE:</div>
              <div>${item.LIQ}</div>
            </div>
        </div> 
      </div>                
      <hr style="${border}">
          `
            )
            .join("")}
        `;
        await page.setContent(content);
        const pdfBuffer = await page.pdf({
          format: "letter",
          landscape: false,
        });
        await broser.close();

        // Enviar el PDF como respuesta
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=reporte.pdf`
        );
        res.status(200).send(pdfBuffer);
      })();
    }
  });
});

/*reporte boleta laboral*/
app.get("/replab/:id", (req, res) => {
  const id = req.params.id;
  const sql = "CALL reportpmlab(?)";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) {
      res.status(500).json({ Status: "Error", Error: err });
    } else {
      (async () => {
        const broser = await puppeteer.launch();
        const page = await broser.newPage();

        const tableStyle = `
          width: 100%;
          margin: 0;
          font-size: 0.5rem;
          font-family: 'Roboto', sans-serif;
        `;
        const cellStyle = `
          border: 1px solid #ddd;
          padding: 4px;
          width: 30%;
        `;
        const divStyle = `
          text-align: center;
          padding: 10px;
        `;

        const gest = result[0][0].gest;
        console.log(gest);

        const content = `
        
          <div style="${divStyle}">
          <h1>Planilla Aportes Laborales</h1>
          <h2>Correspondiente a la gestion ${gest}</h2> 
          <h2>Expresado en Boliviano</h2>
          </div>
        
          <table style="${tableStyle}">
          <tr>
              <th style="${cellStyle}">Código Empleado</th> 
              <th style="${cellStyle}">Nombre Completo</th>
              <th style="${cellStyle}">País de Nacimiento</th> 
              <th style="${cellStyle}">Fecha de Nacimiento</th> 
              <th style="${cellStyle}">Sexo</th>
              <th style="${cellStyle}">Cargo</th>
              <th style="${cellStyle}">Fecha de ingreso</th>
              <th style="${cellStyle}">Horas</th>
              <th style="${cellStyle}">Dias</th>
              <th style="${cellStyle}">Salario Basico</th>
              <th style="${cellStyle}">Salario Basico Calculado</th>
              <th style="${cellStyle}">Total ganado</th>
              <th style="${cellStyle}">CNS</th>
              <th style="${cellStyle}">Aporte 1.71</th>
              <th style="${cellStyle}">Aporte 0.5</th>
              <th style="${cellStyle}">Aporte 0.5</th>
              <th style="${cellStyle}">Aporte may. 13000</th>
              <th style="${cellStyle}">Aporte may. 25000</th>
              <th style="${cellStyle}">Aporte may. 35000</th>
              
                   

          </tr>
          ${result[0]
            .map(
              (item) => `
          <tr>
                <td style="${cellStyle}">${item.cod_emp}</td> 
                <td style="${cellStyle}">${item.nomc}</td>
                <td style="${cellStyle}">${item.birthcountry}</td> 
                <td style="${cellStyle}">${item.birth}</td>
                <td style="${cellStyle}">${item.sex}</td>
                <td style="${cellStyle}">${item.position}</td>
                <td style="${cellStyle}">${item.startd}</td>
                <td style="${cellStyle}">${item.hrs}</td>
                <td style="${cellStyle}">${item.TDT}</td>
                <td style="${cellStyle}">${item.SBB}</td>
                <td style="${cellStyle}">${item.SBC}</td>
                <td style="${cellStyle}">${item.TGA}</td>
                <td style="${cellStyle}">${item.CNS}</td>
                <td style="${cellStyle}">${item.APO1}</td>
                <td style="${cellStyle}">${item.APO2}</td>
                <td style="${cellStyle}">${item.APO3}</td>
                <td style="${cellStyle}">${item.PA13}</td>
                <td style="${cellStyle}">${item.PA25}</td>
                <td style="${cellStyle}">${item.PA35}</td>

                </tr>
              `
            )
            .join("")}
              
          </table>
        `;
        await page.setContent(content);
        const pdfBuffer = await page.pdf({ format: "legal", landscape: true });
        await broser.close();

        // Enviar el PDF como respuesta
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=reporte.pdf`
        );
        res.status(200).send(pdfBuffer);
      })();
    }
  });
});

/*reporte de patronal*/
app.get("/reppat/:id", (req, res) => {
  const id = req.params.id;
  const sql = "CALL reportpmpat(?)";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) {
      res.status(500).json({ Status: "Error", Error: err });
    } else {
      (async () => {
        const broser = await puppeteer.launch();
        const page = await broser.newPage();

        const tableStyle = `
          width: 100%;
          margin: 0;
          font-size: 0.5rem;
          font-family: 'Roboto', sans-serif;
        `;
        const cellStyle = `
          border: 1px solid #ddd;
          padding: 4px;
          width: 30%;
        `;
        const divStyle = `
          text-align: center;
          padding: 10px;
        `;

        const gest = result[0][0].gest;
        console.log(gest);

        const content = `
        
          <div style="${divStyle}">
          <h1>Planilla Aportes Patronales</h1>
          <h2>Correspondiente a la gestion ${gest}</h2> 
          <h2>Expresado en Boliviano</h2>
          </div>
        
          <table style="${tableStyle}">
          <tr>
              <th style="${cellStyle}">Código Empleado</th> 
              <th style="${cellStyle}">Nombre Completo</th>
              <th style="${cellStyle}">País de Nacimiento</th> 
              <th style="${cellStyle}">Fecha de Nacimiento</th> 
              <th style="${cellStyle}">Sexo</th>
              <th style="${cellStyle}">Cargo</th>
              <th style="${cellStyle}">Fecha de ingreso</th>
              <th style="${cellStyle}">Horas</th>
              <th style="${cellStyle}">Dias</th>
              <th style="${cellStyle}">Salario Basico</th>
              <th style="${cellStyle}">Salario Basico Calculado</th>
              <th style="${cellStyle}">Total ganado</th>
              <th style="${cellStyle}">Aportes 10%</th>
              <th style="${cellStyle}">Aporte 1.71%</th>
              <th style="${cellStyle}">Aporte 0.5%</th>
              <th style="${cellStyle}">Aporte 2%</th>
              <th style="${cellStyle}">Aporte 3%</th>
              
              
                   

          </tr>
          ${result[0]
            .map(
              (item) => `
          <tr>
                <td style="${cellStyle}">${item.cod_emp}</td> 
                <td style="${cellStyle}">${item.nomc}</td>
                <td style="${cellStyle}">${item.birthcountry}</td> 
                <td style="${cellStyle}">${item.birth}</td>
                <td style="${cellStyle}">${item.sex}</td>
                <td style="${cellStyle}">${item.position}</td>
                <td style="${cellStyle}">${item.startd}</td>
                <td style="${cellStyle}">${item.hrs}</td>
                <td style="${cellStyle}">${item.TDT}</td>
                <td style="${cellStyle}">${item.SBB}</td>
                <td style="${cellStyle}">${item.SBC}</td>
                <td style="${cellStyle}">${item.TGA}</td>
                <td style="${cellStyle}">${item.CNS}</td>
                <td style="${cellStyle}">${item.APO1}</td>
                <td style="${cellStyle}">${item.APO2}</td>
                <td style="${cellStyle}">${item.APO3}</td>
                <td style="${cellStyle}">${item.APO4}</td>
                

                </tr>
              `
            )
            .join("")}
              
          </table>
        `;
        await page.setContent(content);
        const pdfBuffer = await page.pdf({ format: "legal", landscape: true });
        await broser.close();

        // Enviar el PDF como respuesta
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=reporte.pdf`
        );
        res.status(200).send(pdfBuffer);
      })();
    }
  });
});

/*Reporte de provisiones  */
app.get("/repprov/:id", (req, res) => {
  const id = req.params.id;
  const sql = "CALL reportpmpro(?)";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) {
      res.status(500).json({ Status: "Error", Error: err });
    } else {
      (async () => {
        const broser = await puppeteer.launch();
        const page = await broser.newPage();

        const tableStyle = `
          width: 100%;
          margin: 0;
          font-size: 0.5rem;
          font-family: 'Roboto', sans-serif;
        `;
        const cellStyle = `
          border: 1px solid #ddd;
          padding: 4px;
          width: 30%;
        `;
        const divStyle = `
          text-align: center;
          padding: 10px;
        `;

        const gest = result[0][0].gest;
        console.log(gest);

        const content = `
        
          <div style="${divStyle}">
          <h1>Planilla Provisiones</h1>
          <h2>Correspondiente a la gestion ${gest}</h2> 
          <h2>Expresado en Boliviano</h2>
          </div>
        
          <table style="${tableStyle}">
          <tr>
              <th style="${cellStyle}">Código Empleado</th> 
              <th style="${cellStyle}">Nombre Completo</th>
              <th style="${cellStyle}">País de Nacimiento</th> 
              <th style="${cellStyle}">Fecha de Nacimiento</th> 
              <th style="${cellStyle}">Sexo</th>
              <th style="${cellStyle}">Cargo</th>
              <th style="${cellStyle}">Fecha de ingreso</th>
              <th style="${cellStyle}">Horas</th>
              <th style="${cellStyle}">Dias</th>
              <th style="${cellStyle}">Salario Basico</th>
              <th style="${cellStyle}">Salario Basico Calculado</th>
              <th style="${cellStyle}">Total ganado</th>
              <th style="${cellStyle}">Provision 8.33%</th>
                    
                   

          </tr>
          ${result[0]
            .map(
              (item) => `
          <tr>
                <td style="${cellStyle}">${item.cod_emp}</td> 
                <td style="${cellStyle}">${item.nomc}</td>
                <td style="${cellStyle}">${item.birthcountry}</td> 
                <td style="${cellStyle}">${item.birth}</td>
                <td style="${cellStyle}">${item.sex}</td>
                <td style="${cellStyle}">${item.position}</td>
                <td style="${cellStyle}">${item.startd}</td>
                <td style="${cellStyle}">${item.hrs}</td>
                <td style="${cellStyle}">${item.TDT}</td>
                <td style="${cellStyle}">${item.SBB}</td>
                <td style="${cellStyle}">${item.SBC}</td>
                <td style="${cellStyle}">${item.TGA}</td>
                <td style="${cellStyle}">${item.PRO}</td>
                
                </tr>
              `
            )
            .join("")}
              
          </table>
        `;
        await page.setContent(content);
        const pdfBuffer = await page.pdf({ format: "legal", landscape: true });
        await broser.close();

        // Enviar el PDF como respuesta
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=reporte.pdf`
        );
        res.status(200).send(pdfBuffer);
      })();
    }
  });
});

/*Reporte de planilla tributaria */
app.get("/reptrib/:id", (req, res) => {
  const id = req.params.id;
  const sql = "CALL reportpmtri(?)";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) {
      res.status(500).json({ Status: "Error", Error: err });
    } else {
      (async () => {
        const broser = await puppeteer.launch();
        const page = await broser.newPage();

        const tableStyle = `
          width: 100%;
          margin: 0;
          font-size: 0.5rem;
          font-family: 'Roboto', sans-serif;
        `;
        const cellStyle = `
          border: 1px solid #ddd;
          padding: 4px;
          width: 30%;
        `;
        const divStyle = `
          text-align: center;
          padding: 10px;
        `;

        const gest = result[0][0].gest;
        console.log(gest);

        const content = `
        
          <div style="${divStyle}">
          <h1>Planilla Tributaria</h1>
          <h2>Correspondiente a la gestion ${gest}</h2> 
          <h2>Expresado en Boliviano</h2>
          </div>
        
          <table style="${tableStyle}">
          <tr>
              <th style="${cellStyle}">Año</th> 
              <th style="${cellStyle}">Mes</th>
              <th style="${cellStyle}">RCIVA</th> 
              <th style="${cellStyle}">Nombres</th> 
              <th style="${cellStyle}">Apellido Paterno</th>
              <th style="${cellStyle}">Apellido Materno</th>
              <th style="${cellStyle}">CI</th>
              <th style="${cellStyle}">EXT</th>
              <th style="${cellStyle}">Novedad</th>
              <th style="${cellStyle}">TNE</th>
              <th style="${cellStyle}">T2S</th>
              <th style="${cellStyle}">ISI</th>
              <th style="${cellStyle}">RCI</th>
              <th style="${cellStyle}">R13</th>
              <th style="${cellStyle}">INR</th>
              <th style="${cellStyle}">F11</th>
              <th style="${cellStyle}">SFF</th>
              <th style="${cellStyle}">SFD</th>
              <th style="${cellStyle}">SPA</th>
              <th style="${cellStyle}">MVD</th>
              <th style="${cellStyle}">SMA</th>
              <th style="${cellStyle}">SUT</th>
              <th style="${cellStyle}">IRE</th>
              <th style="${cellStyle}">SMS</th>
                    
                   

          </tr>
          ${result[0]
            .map(
              (item) => `
          <tr>
                <td style="${cellStyle}">${item.anio}</td> 
                <td style="${cellStyle}">${item.mes}</td>
                <td style="${cellStyle}">${item.RCIVA}</td> 
                <td style="${cellStyle}">${item.nom}</td>
                <td style="${cellStyle}">${item.lastname}</td>
                <td style="${cellStyle}">${item.lastname2}</td>
                <td style="${cellStyle}">${item.CI}</td>
                <td style="${cellStyle}">${item.CID}</td>
                <td style="${cellStyle}">${item.NOV}</td>
                <td style="${cellStyle}">${item.TNE}</td>
                <td style="${cellStyle}">${item.T2S}</td>
                <td style="${cellStyle}">${item.ISI}</td>
                <td style="${cellStyle}">${item.RCI}</td>
                <td style="${cellStyle}">${item.R13}</td>
                <td style="${cellStyle}">${item.INR}</td>
                <td style="${cellStyle}">${item.F11}</td>
                <td style="${cellStyle}">${item.SFF}</td>
                <td style="${cellStyle}">${item.SFD}</td>
                <td style="${cellStyle}">${item.SPA}</td>
                <td style="${cellStyle}">${item.MVD}</td>
                <td style="${cellStyle}">${item.SMA}</td>
                <td style="${cellStyle}">${item.SUT}</td>
                <td style="${cellStyle}">${item.IRE}</td>
                <td style="${cellStyle}">${item.SMS}</td>
                
                </tr>
              `
            )
            .join("")}
              
          </table>
        `;
        await page.setContent(content);
        const pdfBuffer = await page.pdf({ format: "legal", landscape: true });
        await broser.close();

        // Enviar el PDF como respuesta
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=reporte.pdf`
        );
        res.status(200).send(pdfBuffer);
      })();
    }
  });
});

/*Reporte laboral */
app.get("/replab/:id", (req, res) => {
  const id = req.params.id;
  const sql = "CALL reportpmlab(?)";
  dbConnection.query(sql, [id], (err, result) => {
    res.json({ Status: "Success", Result: result[0] });
  });
});

/*Reporte patronal */
app.get("/reppat/:id", (req, res) => {
  const id = req.params.id;
  const sql = "CALL reportpmpat(?)";
  dbConnection.query(sql, [id], (err, result) => {
    res.json({ Status: "Success", Result: result[0] });
  });
});

/*Reporte provisiones*/
app.get("/reppro/:id", (req, res) => {
  const id = req.params.id;
  const sql = "CALL reportpmpro(?)";
  dbConnection.query(sql, [id], (err, result) => {
    res.json({ Status: "Success", Result: result[0] });
  });
});

/*Reporte tributaria */
app.get("/reptri/:id", (req, res) => {
  const id = req.params.id;
  const sql = "CALL reportpmtri(?)";
  dbConnection.query(sql, [id], (err, result) => {
    res.json({ Status: "Success", Result: result[0] });
  });
});

/*Reporte de esquemas */
app.get("/repschem/:id", (req, res) => {
  const id = req.params.id;
  const sql = "CALL reportSCHE(?)";
  dbConnection.query(sql, [id], (err, result) => {
    res.json({ Status: "Success", Result: result[0] });
  });
});

/*No duplicar gestion */
app.get("/detgest", (req, res) => {
  const sql = "SELECT gest FROM RRHH.tproce";
  dbConnection.query(sql, (err, result) => {
    res.json({ Status: "Success", Result: result });
  });
});

/*Reporte de vacaciones */
app.get("/detvact", (req, res) => {
  const id = req.params.id;
  const sql = "CALL dvacemt()";
  dbConnection.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ Status: "Error", Error: err });
    } else {
      (async () => {
        const broser = await puppeteer.launch();
        const page = await broser.newPage();

        const tableStyle = `
          width: 100%;
          margin: 0;
          font-size: 0.5rem;
          font-family: 'Roboto', sans-serif;
        `;
        const cellStyle = `
          border: 1px solid #ddd;
          padding: 4px;
          width: 30%;
        `;
        const divStyle = `
          text-align: center;
          padding: 10px;
        `;

        const content = `
        
          <div style="${divStyle}">
            <h1>Vacaciones Generales</h1>
          </div>
        
          <table style="${tableStyle}">
          <tr>
              <th style="${cellStyle}">Código Empleado</th> 
              <th style="${cellStyle}">Nombre Completo</th>
              <th style="${cellStyle}">Fecha de ingreso</th> 
              <th style="${cellStyle}">Años de antiguedad</th> 
              <th style="${cellStyle}">Dias de vacacion</th>
              <th style="${cellStyle}">Dias solicitados</th>
              <th style="${cellStyle}">Total de dias restantes</th>
          </tr>
          ${result[0]
            .map(
              (item) => `
          <tr>
                <td style="${cellStyle}">${item.empid}</td>
                <td style="${cellStyle}">${item.lastname} ${item.lastname2} ${item.firstname} ${item.middlename}</td> 
                <td style="${cellStyle}">${item.startDatee}</td>
                <td style="${cellStyle}">${item.anio}</td>
                <td style="${cellStyle}">${item.anios}</td>
                <td style="${cellStyle}">${item.diasS}</td>
                <td style="${cellStyle}">${item.tdias}</td>
           </tr>
              `
            )
            .join("")}
              
          </table>
        `;
        await page.setContent(content);
        const pdfBuffer = await page.pdf({ format: "legal", landscape: false });
        await broser.close();

        // Enviar el PDF como respuesta
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=reporte.pdf`
        );
        res.status(200).send(pdfBuffer);
      })();
    }
  });
});

/*Historico de empleados */
app.get("/hisempl", (req, res) => {
  const sql = "CALL emphis()";
  dbConnection.query(sql, (err, result) => {
    res.json({ Status: "Success", Result: result });
  });
});

app.get("/reporbank/:id", (req, res) => {
  const id = req.params.id;
  const sql = "CALL reportbank(?)";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) {
      // Manejar errores si es necesario
      res.status(500).json({ error: "Error al obtener datos" });
      return;
    }

    if (result && result[0] && result[0].length > 0) {
      // Obtener el array Result y enviarlo como respuesta
      const data = result[0];
      res.json(data);
    } else {
      // Si no hay datos, enviar una respuesta vacía o un mensaje adecuado
      res.status(404).json({ error: "No se encontraron datos" });
    }
  });
});

/*Puerto de conexion */
const PORT = process.env.PORT || 4000;

/*
httpsServer.listen(PORT, () =>{
  console.log(`Running on HTTPS por: ${PORT}`)
})
*/

app.listen(PORT, console.log(`Running port: ${PORT} `));
