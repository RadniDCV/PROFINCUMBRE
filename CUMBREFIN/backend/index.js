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

const app = express();

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

app.get("/detmanual/:gest", (req, res) => {
  const gest = req.params.gest;
  const sql = "SELECT * FROM dmanual WHERE gest = ?";
  dbConnection.query(sql, [gest], (err, result) => {
    if (err) return res.json({ Error: "Error in runnig query" });
    return res.json({ Status: "Success", Result: result });
  });
});

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

app.get("/get/:id", (req, res) => {
  const id = req.params.id;
  const sql =
    "SELECT *, YEAR(startdate) as anio, MONTH(startdate) as mes, DAY(startdate) as dia  FROM employee where empid = ?";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "Get employee error in sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

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
  } = req.body;
  const sql =
    "UPDATE employee set `martstatus` = ? ,`mobile` = ? , `addresshome` = ?, `addresswork` = ?, `dept` = ?, `branch`= ?,`termdate` = ?,`reasonterm` = ?,`salary` = ?,`nchildren` = ?,`birthcountry` = ?,`nua` = ?,`position` = ?,`profession` = ?,`bank` = ?,`codbank` = ?,`estado` = ?  WHERE empid = ?";
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

app.get("/userdets", (req, res) => {
  const sql = "SELECT username FROM user";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error in running" });
    return res.json(result);
  });
});

app.get("/adminCount", (req, res) => {
  const sql = "SELECT count(id) as admin FROM user";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error in runnig query" });
    return res.json(result);
  });
});

app.get("/salary", (req, res) => {
  const sql =
    "SELECT cast(sum(salary) as decimal(10,2)) as sumOfSalary from employee";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error in runnig query" });
    return res.json(result);
  });
});

app.get("/employeeCount", (req, res) => {
  const sql = "SELECT count(empid) as employee from employee";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error in runnig query" });
    return res.json(result);
  });
});

app.get("/employeefem", (req, res) => {
  const sql = "SELECT count(sex) from employee where sex='02'";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error in runnig query" });
    return res.json(result);
  });
});

app.get("/employeemas", (req, res) => {
  const sql = "SELECT count(sex) from employee where sex='01'";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error in runnig query" });
    return res.json(result);
  });
});

app.get("/getemployee", (req, res) => {
  const sql =
    "SELECT *, DAY(startdate)AS DIA, MONTH(startdate) AS MES, YEAR(startdate) as ANIO, CASE WHEN ext='01' then 'LP' WHEN ext='02' then 'SC' WHEN ext='03' then 'CB' WHEN ext='04' then 'CH' WHEN ext='05' then 'PO' WHEN ext='06' then 'OR' WHEN ext='07' then 'TJ' WHEN ext='08' then 'BE' WHEN ext='09' then 'PA' else 'Extranjero' end extci, case when sex='01'then 'Hombre' else 'Mujer' end sexo, case when martstatus='01' then 'Casado(a)' when martstatus='02' then 'Soltero(a)' when martstatus='03' then 'Viudo(a)' when martstatus='04' then 'Vidorsiado(a)' else '' end marstatuse, case when bank='01' then 'Mercantil Santa Cruz' when bank='02' then 'UNION' when bank='03' then 'BISA' when bank='04' then 'BCP' when bank='05' then 'Prodem' else '' end banks FROM employee order by startdate";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error al obtener empleado sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

//Configuracion de usuarios

//Lista de usuarios
app.get("/usera", (req, res) => {
  const sql = "SELECT * FROM user";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error al obtener usuarios sql" });
    return res.json({ Status: "Success", Result: result });
  });
});
//Crear usuarios
app.post("/creauser", (req, res) => {
  const sql =
    "INSERT INTO user (`username`,`email`,`password`,`role`) VALUES (?)";
  bcrypt.hash(req.body.password.toString(), 10, (err, hash) => {
    if (err) return res.json({ Error: "Error in hashing password" });
    const values = [req.body.username, req.body.email, hash, req.body.role];
    dbConnection.query(sql, [values], (err, result) => {
      if (err) return res.json({ Error: "Inside query" });
      /*console.log(values);*/
      return res.json({ Status: "Success" });
    });
  });
});
//Eliminar usuarios
app.delete("/deluser/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM user WHERE id = ?";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete error in sql" });
    return res.json({ Status: "Success" });
  });
});

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

//Configuracion de gestiones
//Lista de gestiones
app.get("/gest", (req, res) => {
  const sql = "SELECT * FROM gest";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error al obtener gestion sql" });
    return res.json({ Status: "Success", Result: result });
  });
});
//Crear gestion
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
//Eliminar gestion

app.delete("/delpayem/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM payusr WHERE id = ?";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete payemp error in sql " });
    return res.json({ Status: "Success" });
  });
});

app.delete("/delgest/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM gest WHERE id = ?";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete gestion error in sql" });
    return res.json({ Status: "Success" });
  });
});

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

app.get("/ufvinfo", (req, res) => {
  const sql = "SELECT * FROM ufv";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error al obtener gestion sql" });
    return res.json({ Status: "Success", Result: result });
  });
});

app.delete("/delufv/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM ufv WHERE id = ?";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete gestion error in sql" });
    return res.json({ Status: "Success" });
  });
});

app.delete("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM employee WHERE empid = ?";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete employee error in sql" });
    return res.json({ Status: "Success" });
  });
});

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

app.delete("/deldept/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM depart WHERE id = ?";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete department error in sql" });
    return res.json({ Status: "Success" });
  });
});

app.get("/depart", (req, res) => {
  const sql = "SELECT * FROM depart";
  dbConnection.query(sql, (err, result) => {
    if (err) return res.json({ Error: "Error in runnig query" });
    return res.json({ Status: "Success", Result: result });
  });
});

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

app.get("/detapay", (req, res) => {
  const sql = "SELECT * FROM crepay";
  dbConnection.query(sql, (err, result) => {
    if (err) return res, json({ Error: "Error in runnig query" });
    return res.json({ Status: "Success", Result: result });
  });
});

app.delete("/delepay/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM crepay WHERE id = ?";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete creapay error in sql" });
    return res.json({ status: "Success" });
  });
});

app.get("/branch", (req, res) => {
  const sql = "SELECT * FROM branch";
  dbConnection.query(sql, (err, result) => {
    if (err) return res, json({ Error: "Error in runnig query" });
    return res.json({ Status: "Success", Result: result });
  });
});

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

app.delete("/delbranc/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM branch WHERE id = ?";
  dbConnection.query(sql, [id], (err, result) => {
    if (err) return res.json({ Error: "delete branch error in sql" });
    return res.json({ Status: "Success" });
  });
});

app.delete("/deldtma/:gest", (req, res) => {
  const gest = req.params.gest;
  const sql = "DELETE FROM dmanual where gest = ?";
  dbConnection.query(sql, [gest], (err, result) => {
    if (err) return res.json({ Error: "delete dmanules error in sql" });
    return res.json({ Status: "Successs" });
  });
});

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
        return res.json({ Status: "Success" });
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

///---

app.post("/employeelogin", (req, res) => {
  const sql = "SELECT * FROM employee WHERE email = ?";

  dbConnection.query(sql, [req.body.email], (err, result) => {
    console.log(result[0].empid);
    if (err)
      return res.json({ Status: "Error", Error: "Error in runnig query" });
    if (result.length > 0) {
      bcrypt.compare(
        req.body.password.toString(),
        result[0].password,
        (err, response) => {
          if (err) return res.json({ Error: "password error" });
          if (response) {
            const token = jwt.sign(
              { role: "02", empid: result[0].empid },
              "jwt-secret-key",
              {
                expiresIn: "2h",
              }
            );
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

app.post("/create", multerUpload.single("image"), (req, res) => {
  const sql =
    "INSERT INTO employee (`firstname`,`middlename`,`lastname`,`lastname2`,`ci`,`ext`,`birthdate`,`sex`,`martstatus`,`mobile`,`addresshome`,`addresswork`,`dept`,`branch`,`startdate`,`termdate`,`reasonterm`,`salary`,`nchildren`,`birthcountry`,`nua`,`afp`,`tipjub`,`position`,`profession`,`bank`,`codbank`,`password`,`email`,`role`,`estado`,`image`) VALUES (?)";
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
      imagePath,
    ];
    dbConnection.query(sql, [values], (err, result) => {
      if (err) return res.json({ Error: "Inside signup query" });
      return res.json({ Status: "Success" });
    });
  });
});

/*fileUpload debe estar al final para no tener conflicto */
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

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ status: "Success" });
});

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

app.get("/delpla/:id", (req, res) => {
  const id = req.params.id;
  dbConnection.query("CALL delPla(?)", [id], (error, result) => {
    /*console.log(result);*/
    res.json(result);
  });
});

app.get("/rplacalc/:id", (req, res) => {
  const id = req.params.id;
  dbConnection.query("CALL reportPG(?)", [id], (err, result) => {
    /*console.log(result);*/
    res.json({ Status: "Success", Result: result[0] });
  });
});

app.get("/rppro/:id", (req, res) => {
  const id = req.params.id;
  dbConnection.query("CALL reportAPO(?)", [id], (err, result) => {
    /*console.log(result);*/
    res.json({ Status: "Success", Result: result[0] });
  });
});

app.get("/rpliq", (req, res) => {
  dbConnection.query("CALL reportLIQ()", (err, result) => {
    /*console.log(result);*/
    res.json({ Status: "Success", Result: result[0] });
  });
});

app.get("/rpbirth/:id", (req, res) => {
  const id = req.params.id;
  dbConnection.query("CALL birth(?)", [id], (err, result) => {
    /*console.log(result);*/
    res.json({ Status: "Success", Result: result[0] });
  });
});

app.get("/rpsex", (req, res) => {
  const id = req.params.id;
  dbConnection.query("CALL sexemp()", (err, result) => {
    /*console.log(result);*/
    res.json({ Status: "Success", Result: result[0] });
  });
});

app.get("/rpsexm", (req, res) => {
  dbConnection.query("CALL sexempm()", (err, result) => {
    /*console.log(result);*/
    res.json({ Status: "Success", Result: result[0] });
  });
});

app.get("/rpnewemp", (req, res) => {
  dbConnection.query("CALL newempmes()", (err, result) => {
    /*console.log(result);*/
    res.json({ Status: "Success", Result: result[0] });
  });
});

app.get("/rpvac", (req, res) => {
  dbConnection.query("CALL vacemp()", (err, result) => {
    res.json({ Status: "Success", Result: result[0] });
  });
});

app.get("/rpempfdep", (req, res) => {
  const sql =
    "select dept as departamento, count(*) as empleados from employee group by dept";
  dbConnection.query(sql, (err, result) => {
    res.json({ Status: "Success", Result: result });
  });
});

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

app.get("/detvacp", (req, res) => {
  dbConnection.query("CALL dvacp()", (err, result) => {
    res.json({ Status: "Success", Result: result[0] });
  });
});

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

app.get("/nrosolp", (req, res) => {
  const sql =
    "SELECT IFNULL(count(estate),0) nsol FROM RRHH.vacSol WHERE estate='S'";
  dbConnection.query(sql, (err, result) => {
    res.json({ Status: "Success", Result: result });
  });
});

app.get("/vacempp/:id", (req, res) => {
  const id = req.params.id;
  const sql = "CALL vacempp(?)";
  dbConnection.query(sql, [id], (err, result) => {
    res.json({ Status: "Success", Result: result[0] });
  });
});

app.get("/vacempd/:id", (req, res) => {
  const id = req.params.id;
  const sql = "CALL vacempdt(?)";
  dbConnection.query(sql, [id], (err, result) => {
    res.json({ Status: "Success", Result: result[0] });
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, console.log(`Running port: ${PORT} `));
