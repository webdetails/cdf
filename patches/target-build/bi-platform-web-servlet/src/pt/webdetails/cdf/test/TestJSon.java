package pt.webdetails.cdf.test;

import java.util.Calendar;
import java.util.Date;

import org.json.JSONObject;


public class TestJSon {

    public TestJSon(){
    
    }

    public String doTest() throws Exception {
        Employee p = new Employee(11,"Biju",new Salary(100));
        JSONObject obj = new JSONObject(p,false);
        return obj.toString(1);

        
    }

    public static void main(String[] args) throws Exception{

        Employee p = new Employee(11,"Biju",new Salary(100));
        JSONObject obj = new JSONObject(p,false);
        System.out.println(obj.toString(1));

        Date d = Calendar.getInstance().getTime();
        System.out.println(p.getClass().getClassLoader());
    }
}
/*

   {
   "LMap": {
   "SAL-1": {"basicPay": 3011},
   "SAL-2": {"basicPay": 4012}
   },
   "age": 11,
   "intge": 77,
   "l": [
   {"basicPay": 301},
   {"basicPay": 401}
   ],
   "name": "www",
   "sal": {"basicPay": 100},
   "salArray": [
   {"basicPay": 30},
   {"basicPay": 40}
   ],
   "status": false
   }

*/
