package pt.webdetails.cdf.test;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.Hashtable;
import java.util.List;


public class Employee {
    int age;
    String name;
    Salary sal;
    Integer intge = new Integer(77);
    Boolean status = new Boolean(false);
    Date date = Calendar.getInstance().getTime();

    Salary[] salArray = {new Salary(30),new Salary(40)};

    List l = new ArrayList();
    {
            l.add(new Salary(301));
            l.add(new Salary(401));
    };

    Hashtable lMap = new Hashtable();
    {
        lMap.put("SAL-1",new Salary(3011));
        lMap.put("SAL-2",new Salary(4012));
    };
    public Employee(int age, String name, Salary sal) {
        super();
        this.age = age;
        this.name = name;
        this.sal = sal;
    }

    public int getAge() {
        return age;
    }
    public void setAge(int age) {
        this.age = age;
    }
    public Integer getIntge() {
        return intge;
    }
    public void setIntge(Integer intge) {
        this.intge = intge;
    }
    public List getL() {
        return l;
    }
    public void setL(List l) {
        this.l = l;
    }
    public Hashtable getLMap() {
        return lMap;
    }
    public void setLMap(Hashtable map) {
        lMap = map;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public Salary getSal() {
        return sal;
    }
    public void setSal(Salary sal) {
        this.sal = sal;
    }
    public Salary[] getSalArray() {
        return salArray;
    }
    public void setSalArray(Salary[] salArray) {
        this.salArray = salArray;
    }
    public Boolean getStatus() {
        return status;
    }
    public void setStatus(Boolean status) {
        this.status = status;
    }

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }


}
