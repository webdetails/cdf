/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package pt.webdetails.packager;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.SequenceInputStream;
import java.util.Enumeration;
import java.util.NoSuchElementException;

/**
 *
 * @author pdpi
 */
class Concatenate
{

  public static InputStream concat(File[] files)
  {
    ListOfFiles mylist = new ListOfFiles(files);

    return new SequenceInputStream(mylist);
  }
}

class ListOfFiles implements Enumeration<FileInputStream>
{

  private File[] listOfFiles;
  private int current = 0;

  public ListOfFiles(File[] listOfFiles)
  {
    this.listOfFiles = listOfFiles;
  }

  public boolean hasMoreElements()
  {
    if (current < listOfFiles.length)
    {
      return true;
    }
    else
    {
      return false;
    }
  }

  public FileInputStream nextElement()
  {
    FileInputStream in = null;

    if (!hasMoreElements())
    {
      throw new NoSuchElementException("No more files.");
    }
    else
    {
      File nextElement = listOfFiles[current];
      current++;
      try
      {
        in = new FileInputStream(nextElement);
      }
      catch (FileNotFoundException e)
      {
        System.err.println("ListOfFiles: Can't open " + nextElement);
      }
    }
    return in;
  }
}
