# Community Dashboard Framework

**CDF** is a Dashboard framework that allows custom dashboards to be built

**CDF** is one of the _tools_ of the **CTools** family and it is shipped within Pentaho BA Server

This is a maven project, and to build it use the following command
```
mvn clean install
```
The build result will be a Pentaho Plugin located in *assemblies/cdf/target/pentaho-cdf-**.zip*. Then, this package can be dropped inside your system folder.

Additionally, **CDF** build environment requires some configuration on your maven *settings.xml* file.
The file is located under your .m2 directory on your home folder. Please make sure the following configuration is added:
```
<!-- profiles -->
<profile>
  <id>pentaho</id>
  <activation>
    <activeByDefault>true</activeByDefault>
  </activation>
  <repositories>
    <repository>
      <id>pentaho-nexus</id>
      <name>Nexus Internal</name>
      <url>http://nexus.pentaho.org/content/groups/omni</url>
    </repository>
  </repositories>
  <pluginRepositories>
    <pluginRepository>
      <id>pentaho-nexus</id>
      <name>Nexus Internal</name>
      <url>http://nexus.pentaho.org/content/groups/omni</url>
    </pluginRepository>
  </pluginRepositories>
</profile>

<!-- mirrors -->
<mirror>
  <id>pentaho-internal-repository</id>
  <url>http://nexus.pentaho.org/content/groups/omni</url>
  <mirrorOf>*</mirrorOf>
</mirror>
```

If you don't already have a *settings.xml* file on that location, this is a stock one you can use:
```

<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0
                         http://maven.apache.org/xsd/settings-1.0.0.xsd">
   <localRepository/>
  <interactiveMode/>
  <usePluginRegistry/>
  <offline/>
  <pluginGroups/>
  <servers/>
  <mirrors/>
  <proxies/>
  <profiles>
    <profile>
      <id>pentaho</id>
      <activation>
        <activeByDefault>true</activeByDefault>
      </activation>
      <repositories>
        <repository>
          <id>pentaho-nexus</id>
          <name>Nexus Internal</name>
          <url>http://nexus.pentaho.org/content/groups/omni</url>
        </repository>
      </repositories>
      <pluginRepositories>
        <pluginRepository>
          <id>pentaho-nexus</id>
          <name>Nexus Internal</name>
          <url>http://nexus.pentaho.org/content/groups/omni</url>
        </pluginRepository>
      </pluginRepositories>
    </profile>
  </profiles>
 <activeProfiles/>
</settings>
```


For issue tracking and bug report please use http://jira.pentaho.com/browse/CDF. Its master branch is built upon commit merges in Jenkins Continuous Integration located in http://ci.pentaho.com/job/cdf-plugin/
