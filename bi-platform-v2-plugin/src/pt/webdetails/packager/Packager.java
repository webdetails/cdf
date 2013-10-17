/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

package pt.webdetails.packager;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.InputStream;
import java.io.Reader;

import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.apache.commons.io.IOUtils;
import org.apache.commons.io.output.NullOutputStream;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import pt.webdetails.cpf.packager.Concatenate;

/**
 *
 * @author pdpi
 */
public class Packager
{

  public enum Filetype
  {

    CSS, JS
  };
  static Log logger = LogFactory.getLog(Packager.class);
  private static Packager _instance;
  private HashMap<String, FileSet> fileSets;

  private Packager()
  {
    this.fileSets = new HashMap<String, FileSet>();
  }

  public static synchronized Packager getInstance()
  {
    if (_instance == null)
    {
      _instance = new Packager();
    }
    return _instance;

  }

  public void registerPackage(Filetype type, String root, String filename, String[] files)
  {
    registerPackage(filename, type, root, filename, files);
  }

  public void registerPackage(String name, Filetype type, String root, String filename, String[] files)
  {
    ArrayList<File> fileHandles = new ArrayList<File>();
    for (String file : files)
    {
      fileHandles.add(new File((root + "/" + file).replaceAll("/+", "/")));
    }

    registerPackage(name, type, root, filename, (File[]) fileHandles.toArray(new File[fileHandles.size()]));
  }

  public void registerPackage(String name, Filetype type, String root, String output, File[] files)
  {
    if (this.fileSets.containsKey(name))
    {
      Logger.getLogger(Packager.class.getName()).log(Level.WARNING, name + " is overriding an existing file package!");
    }
    try
    {
      FileSet fileSet = new FileSet(output, type, files, root);
      this.fileSets.put(name, fileSet);
    }
    catch (IOException ex)
    {
      Logger.getLogger(Packager.class.getName()).log(Level.SEVERE, null, ex);
    }
    catch (NoSuchAlgorithmException ex)
    {
      Logger.getLogger(Packager.class.getName()).log(Level.SEVERE, null, ex);
    }

  }

  public boolean isPackageRegistered(String pkg)
  {
    return this.fileSets.containsKey(pkg);
  }

  public String minifyPackage(String pkg)
  {
    try
    {
      return this.fileSets.get(pkg).update();
    }
    catch (IOException ex)
    {
      Logger.getLogger(Packager.class.getName()).log(Level.SEVERE, null, ex);
    }
    catch (NoSuchAlgorithmException ex)
    {
      Logger.getLogger(Packager.class.getName()).log(Level.SEVERE, null, ex);
    }
    return "";
  }
}

class FileSet
{

  private boolean dirty;
  private String latestVersion;
  private ArrayList<File> files;
  private File location;
  private Packager.Filetype filetype;
  private String rootdir;

  public void addFile(String file)
  {
    addFile(new File(file));
  }

  public void addFile(File file)
  {
    if (files.indexOf(file) == -1)
    {
      this.dirty = true;
      this.files.add(file);
    }
  }

  public FileSet(String location, Packager.Filetype type, File[] fileSet, String rootdir) throws IOException, NoSuchAlgorithmException
  {
    this.files = new ArrayList<File>();
    this.files.addAll(Arrays.asList(fileSet));
    this.location = new File(location);
    this.filetype = type;
    this.latestVersion = "";
    this.dirty = true;
    this.rootdir = rootdir;
  }

  public FileSet() throws IOException, NoSuchAlgorithmException
  {
    dirty = true;
    files = new ArrayList<File>();
    latestVersion = null;
    location = null;
  }

  private String minify() throws IOException, NoSuchAlgorithmException
  {
    InputStream concatenatedStream = null;
    Reader freader = null;
    FileInputStream script = null;
    DigestInputStream digestStream = null;
    try
    {
      switch (this.filetype)
      {
        case JS:
          concatenatedStream = Concatenate.concat(this.files.toArray(new File[this.files.size()]));
          freader = new InputStreamReader(concatenatedStream, "UTF8");

          JSMin jsmin = new JSMin(concatenatedStream, new FileOutputStream(location));
          jsmin.jsmin();
          break;
        case CSS:
          concatenatedStream = Concatenate.concat(this.files.toArray(new File[this.files.size()]), rootdir);
          FileWriter wout = new FileWriter(location);
          IOUtils.copy(concatenatedStream, wout, "UTF8");
          wout.close();
          break;
      }

      script = new FileInputStream(location);
      MessageDigest digest = MessageDigest.getInstance("MD5");
      digestStream = new DigestInputStream(script, digest);
      IOUtils.copy(digestStream, NullOutputStream.NULL_OUTPUT_STREAM);
      this.latestVersion = byteToHex(digest.digest());
      this.dirty = false;
      return latestVersion;
    }
    catch (Exception ex)
    {
      Logger.getLogger(FileSet.class.getName()).log(Level.SEVERE, null, ex);
      return null;
    }
    finally {
      IOUtils.closeQuietly(concatenatedStream);
      IOUtils.closeQuietly(freader);
      IOUtils.closeQuietly(digestStream);
      IOUtils.closeQuietly(script);
    }
  }

  private String byteToHex(byte[] bytes)
  {
    StringBuffer hexString = new StringBuffer();
    for (int i = 0; i < bytes.length; i++)
    {
      String byteValue = Integer.toHexString(0xFF & bytes[i]);
      hexString.append(byteValue.length() == 2 ? byteValue : "0" + byteValue);
    }
    return hexString.toString();
  }

  public String update() throws IOException, NoSuchAlgorithmException
  {
    return update(false);
  }

  public synchronized String update(boolean force) throws IOException, NoSuchAlgorithmException
  {
    // If we're not otherwise sure we must update, we actively check if the
    //minified file is older than any file in the set.
    if (!dirty && !force)
    {
      for (File file : files)
      {
        if (!location.exists() || file.lastModified() > location.lastModified())
        {
          this.dirty = true;
          break;
        }
      }
    }
    return (dirty || force) ? this.minify() : this.latestVersion;
  }
}

